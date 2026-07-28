import { parseDarajaTimestamp } from "@/server/services/mpesa/client";
import { completeMpesaTransaction, failMpesaTransaction } from "@/server/services/mpesa/complete-transaction";
import { toCents } from "@/lib/money";
import type { MpesaTransaction } from "@/generated/prisma/client";

/** Shared by the live /api/mpesa/callback route and the platform portal's "replay" action, so a stored rawCallback always gets processed exactly the same way it would live. */
export async function processStkCallbackBody(txn: MpesaTransaction, body: Record<string, unknown>) {
  const stkCallback = (body as { Body?: { stkCallback?: Record<string, unknown> } }).Body?.stkCallback;
  if (!stkCallback) return;

  const resultCode = Number(stkCallback.ResultCode);
  if (resultCode !== 0) {
    await failMpesaTransaction(txn, String(resultCode), String(stkCallback.ResultDesc ?? ""));
    return;
  }

  const items = ((stkCallback.CallbackMetadata as { Item?: { Name: string; Value: unknown }[] } | undefined)?.Item) ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;

  await completeMpesaTransaction(txn, {
    amountCents: toCents(Number(get("Amount"))),
    mpesaReceipt: String(get("MpesaReceiptNumber") ?? ""),
    paidAt: parseDarajaTimestamp(String(get("TransactionDate") ?? "")),
    resultDesc: String(stkCallback.ResultDesc ?? ""),
  });
}
