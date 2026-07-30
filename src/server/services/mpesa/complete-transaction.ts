import { db } from "@/server/db/client";
import { allocatePayment, notifyPaymentReceived } from "@/server/services/billing/allocate-payment";
import { generateAndStoreReceipt } from "@/server/services/billing/generate-receipt";
import type { MpesaTransaction } from "@/generated/prisma/client";

/**
 * Shared by the callback handler and the reconciliation sweep — marks a
 * transaction COMPLETED and runs the matching side effect (subscription
 * activation or rent allocation) in one transaction. Safe to call twice for
 * the same transaction: callers must check `txn.status !== "COMPLETED"` first.
 */
export async function completeMpesaTransaction(
  txn: MpesaTransaction,
  outcome: { mpesaReceipt: string | null; paidAt: Date; resultDesc: string; amountCents?: number },
) {
  let completedPaymentId: string | undefined;

  await db.$transaction(
    async (tx) => {
      await tx.mpesaTransaction.update({
        where: { id: txn.id },
        data: { status: "COMPLETED", resultCode: "0", resultDesc: outcome.resultDesc, mpesaReceipt: outcome.mpesaReceipt },
      });

      if (txn.purpose === "SUBSCRIPTION" && txn.orgId) {
        const sub = await tx.subscription.findUnique({ where: { orgId: txn.orgId } });
        if (sub) {
          const periodDays = sub.plan === "ANNUAL" ? 365 : 30;
          await tx.subscription.update({
            where: { orgId: txn.orgId },
            data: { status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + periodDays * 86_400_000) },
          });
        }
      }

      if (txn.purpose === "RENT" && txn.tenantId && txn.leaseId && txn.orgId) {
        const { paymentId } = await allocatePayment(
          {
            orgId: txn.orgId,
            tenantId: txn.tenantId,
            leaseId: txn.leaseId,
            amountCents: outcome.amountCents ?? txn.amountCents,
            method: "MPESA",
            mpesaReceipt: outcome.mpesaReceipt ?? undefined,
            paidAt: outcome.paidAt,
          },
          tx,
        );
        completedPaymentId = paymentId;
      }
    },
    { maxWait: 5000, timeout: 20000 },
  );

  if (completedPaymentId) {
    // The transaction above has committed by this point — safe to run the
    // external-I/O side effects (notify, receipt) now. allocatePayment was
    // called with our own `tx`, so it deliberately skipped notifying itself
    // (see the comment on allocatePayment) — we do it here instead.
    await notifyPaymentReceived(txn.tenantId!, outcome.amountCents ?? txn.amountCents);
    await generateAndStoreReceipt(completedPaymentId).catch((e) => console.error("[mpesa] receipt failed", completedPaymentId, e));
  }
}

export async function failMpesaTransaction(txn: MpesaTransaction, resultCode: string, resultDesc: string) {
  await db.mpesaTransaction.update({ where: { id: txn.id }, data: { status: "FAILED", resultCode, resultDesc } });
}
