"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth as authBusiness } from "@/server/auth/business";
import { auth as authPlatform } from "@/server/auth/platform";
import { requireOrg, requireRole } from "@/server/auth/session";
import { queryStkStatus } from "@/server/services/mpesa/client";
import { completeMpesaTransaction, failMpesaTransaction } from "@/server/services/mpesa/complete-transaction";
import { processStkCallbackBody } from "@/server/services/mpesa/process-callback";

export type ActionState = { error?: string; success?: boolean } | undefined;

/** Manager reconciliation page — check one stuck transaction against Daraja right now, instead of waiting for the 30-minute sweep. */
export async function checkMpesaStatusAction(transactionId: string): Promise<ActionState> {
  const session = await authBusiness();
  requireRole(session, ["MANAGER"]);
  const orgId = requireOrg(session);

  const txn = await db.mpesaTransaction.findFirst({ where: { id: transactionId, orgId } });
  if (!txn) return { error: "Transaction not found." };
  if (txn.status !== "INITIATED") return { error: "Already resolved." };

  const result = await queryStkStatus(txn.checkoutRequestId).catch(() => null);
  if (!result) return { error: "M-Pesa hasn't resolved this yet. Try again shortly." };

  if (result.resultCode === "0") {
    await completeMpesaTransaction(txn, { mpesaReceipt: null, paidAt: new Date(), resultDesc: result.resultDesc });
  } else {
    await failMpesaTransaction(txn, result.resultCode, result.resultDesc);
  }

  revalidatePath("/app/settings/reconciliation");
  return { success: true };
}

/** Platform portal's raw webhook viewer — reprocess a stored rawCallback exactly as the live route would. */
export async function replayMpesaCallbackAction(transactionId: string): Promise<ActionState> {
  const session = await authPlatform();
  requireRole(session, ["PLATFORM_ADMIN"]);

  const txn = await db.mpesaTransaction.findUnique({ where: { id: transactionId } });
  if (!txn) return { error: "Transaction not found." };
  if (!txn.rawCallback) return { error: "No stored callback to replay." };
  if (txn.status === "COMPLETED") return { error: "Already completed — replaying would double-process it." };

  await processStkCallbackBody(txn, txn.rawCallback as Record<string, unknown>);

  revalidatePath("/platform/mpesa");
  return { success: true };
}
