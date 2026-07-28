import { db } from "@/server/db/client";
import { initiateSTKPush, isMpesaConfigured } from "@/server/services/mpesa/client";
import { isStkPushRateLimited } from "@/server/services/redis/ratelimit";
import type { MpesaPurpose } from "@/generated/prisma/client";

export type InitiatePaymentParams = {
  orgId?: string;
  tenantId?: string;
  leaseId?: string;
  purpose: MpesaPurpose;
  phone: string; // 254XXXXXXXXX
  amountCents: number;
  accountRef: string;
  description: string;
};

export type InitiatePaymentResult = { transactionId: string; checkoutRequestId: string } | { error: string };

export async function initiateMpesaPayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  if (!isMpesaConfigured()) {
    return { error: "M-Pesa payments aren't configured yet. Use manual payment recording instead." };
  }
  if (await isStkPushRateLimited(params.phone)) {
    return { error: "Too many payment attempts for this number. Wait a few minutes and try again." };
  }

  // Row exists BEFORE we ever call Safaricom — checkoutRequestId gets its
  // real value once the STK push request returns one. A unique NOT NULL
  // column can't start empty, so it starts as a throwaway placeholder.
  const txn = await db.mpesaTransaction.create({
    data: {
      orgId: params.orgId,
      tenantId: params.tenantId,
      leaseId: params.leaseId,
      purpose: params.purpose,
      checkoutRequestId: `pending:${crypto.randomUUID()}`,
      phone: params.phone,
      amountCents: params.amountCents,
      accountRef: params.accountRef,
      status: "INITIATED",
    },
  });

  try {
    const { checkoutRequestId, merchantRequestId } = await initiateSTKPush({
      phone: params.phone,
      amountCents: params.amountCents,
      accountRef: params.accountRef,
      description: params.description,
    });
    await db.mpesaTransaction.update({ where: { id: txn.id }, data: { checkoutRequestId, merchantRequestId } });
    return { transactionId: txn.id, checkoutRequestId };
  } catch (e) {
    await db.mpesaTransaction.update({
      where: { id: txn.id },
      data: { status: "FAILED", resultDesc: e instanceof Error ? e.message : "STK push failed." },
    });
    return { error: "Couldn't reach M-Pesa. Check the number and try again." };
  }
}
