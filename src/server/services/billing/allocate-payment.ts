import { db } from "@/server/db/client";
import type { PaymentMethod, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export type OpenInvoice = { id: string; balanceCents: number };
export type Allocation = { invoiceId: string; appliedCents: number; newBalanceCents: number };

/**
 * Pure FIFO allocation math — oldest invoice first, partial settle if short,
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

/** Runs inside `tx` if given (e.g. the M-Pesa callback, which must mark the transaction COMPLETED and allocate the payment atomically) — otherwise opens its own. */
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
  return db.$transaction(run, { maxWait: 5000, timeout: 20000 });
}
