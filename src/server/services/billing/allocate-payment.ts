import { db } from "@/server/db/client";
import { notify } from "@/server/services/notifications/notify";
import { formatKES } from "@/lib/money";
import type { PaymentMethod, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export type OpenInvoice = { id: string; balanceCents: number };
export type Allocation = { invoiceId: string; appliedCents: number; newBalanceCents: number };

/**
 * Pure FIFO allocation math : oldest invoice first, partial settle if short,
 * overflow to the next invoice if long. Whatever's left over is a credit.
 * `openInvoices` must already be sorted oldest-due-first.
 */
export function computeAllocation(openInvoices: OpenInvoice[], amountCents: number): { allocations: Allocation[]; creditCents: number } {
  let remaining = amountCents;
  const allocations: Allocation[] = [];

  for (const inv of openInvoices) {
    if (remaining <= 0) break;
    if (inv.balanceCents <= 0) continue;
    const applied = Math.min(remaining, inv.balanceCents);
    allocations.push({ invoiceId: inv.id, appliedCents: applied, newBalanceCents: inv.balanceCents - applied });
    remaining -= applied;
  }

  return { allocations, creditCents: remaining };
}

/**
 * Notifies a tenant that a payment was received and applied. Isolated into
 * its own try/catch : notify() does a DB write plus an external publishJob
 * call, so a failure here must never undo or mask a payment that already
 * landed. Exported so callers that pass their own `tx` into allocatePayment
 * (the M-Pesa callback) can call this themselves once *their* transaction
 * has actually committed, instead of allocatePayment calling it too early.
 */
export async function notifyPaymentReceived(tenantId: string, amountCents: number) {
  try {
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { userId: true } });
    if (!tenant?.userId) return;
    await notify(tenant.userId, {
      type: "payment.received",
      title: "Payment received",
      body: `We've received your payment of ${formatKES(amountCents)} and applied it to your account.`,
      link: "/my/payments",
    });
  } catch (e) {
    console.error("[notify] payment.received failed for tenant", tenantId, e);
  }
}

/**
 * Runs inside `tx` if given (e.g. the M-Pesa callback, which must mark the
 * transaction COMPLETED and allocate the payment atomically) : otherwise
 * opens its own.
 *
 * Notification placement: when we open our own transaction (the manual
 * "record payment" call site), it has fully committed by the time
 * `db.$transaction` resolves below, so we notify right there. When a `tx`
 * is passed in, this function does not own the transaction's lifecycle :
 * the caller's transaction is still open when `run(tx)` returns here, so
 * notifying at this point would fire notify() (external I/O) *inside* a
 * live DB transaction. In that case we deliberately skip notifying and
 * leave it to the caller to call `notifyPaymentReceived` once its own
 * transaction has committed (see completeMpesaTransaction).
 */
export async function allocatePayment(
  params: {
    orgId: string;
    tenantId: string;
    leaseId: string;
    amountCents: number;
    method: PaymentMethod;
    reference?: string;
    mpesaReceipt?: string;
    paidAt: Date;
    recordedById?: string;
  },
  tx?: Tx,
) {
  const run = async (t: Tx) => {
    const payment = await t.payment.create({
      data: {
        orgId: params.orgId,
        tenantId: params.tenantId,
        leaseId: params.leaseId,
        amountCents: params.amountCents,
        method: params.method,
        reference: params.reference,
        mpesaReceipt: params.mpesaReceipt,
        paidAt: params.paidAt,
        recordedById: params.recordedById,
        status: "COMPLETED",
      },
    });

    const openInvoices = await t.invoice.findMany({
      where: { orgId: params.orgId, leaseId: params.leaseId, balanceCents: { gt: 0 } },
      orderBy: { dueDate: "asc" },
    });
    const { allocations, creditCents } = computeAllocation(openInvoices, params.amountCents);

    for (const a of allocations) {
      await t.invoice.update({
        where: { id: a.invoiceId },
        data: {
          paidCents: { increment: a.appliedCents },
          balanceCents: a.newBalanceCents,
          status: a.newBalanceCents === 0 ? "PAID" : "PARTIALLY_PAID",
        },
      });
      await t.paymentAllocation.create({
        data: { paymentId: payment.id, invoiceId: a.invoiceId, amountCents: a.appliedCents },
      });
    }

    if (creditCents > 0) {
      await t.tenant.update({ where: { id: params.tenantId }, data: { creditCents: { increment: creditCents } } });
    }

    const invoiceIds = allocations.map((a) => a.invoiceId);
    return { paymentId: payment.id, creditCents, invoiceIds };
  };

  if (tx) return run(tx);

  const result = await db.$transaction(run, { maxWait: 5000, timeout: 20000 });
  await notifyPaymentReceived(params.tenantId, params.amountCents);
  return result;
}
