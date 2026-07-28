import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { queryStkStatus, isMpesaConfigured } from "@/server/services/mpesa/client";
import { completeMpesaTransaction, failMpesaTransaction } from "@/server/services/mpesa/complete-transaction";
import { withJobSignature } from "@/server/services/queue/verify";

const STUCK_AFTER_MS = 10 * 60 * 1000;

// Runs every 30 minutes (scripts/qstash-schedules.mjs). Daraja's STK Push
// Query endpoint confirms success/failure but — unlike the callback — never
// carries CallbackMetadata, so a reconciled success is recorded using the
// amount we originally requested, with no mpesaReceipt. That's still
// materially better than a payment silently lost because a callback never
// arrived.
async function handler() {
  if (!isMpesaConfigured()) return NextResponse.json({ checked: 0 });

  const stuck = await db.mpesaTransaction.findMany({
    where: { status: "INITIATED", createdAt: { lt: new Date(Date.now() - STUCK_AFTER_MS) } },
  });

  let resolved = 0;
  for (const txn of stuck) {
    if (txn.checkoutRequestId.startsWith("pending:")) continue; // never actually reached Safaricom

    const result = await queryStkStatus(txn.checkoutRequestId).catch((e) => {
      console.error("[reconcile-mpesa] query failed for", txn.checkoutRequestId, e);
      return null;
    });
    if (!result) continue; // still can't tell — leave it for the next sweep

    if (result.resultCode === "0") {
      await completeMpesaTransaction(txn, { mpesaReceipt: null, paidAt: new Date(), resultDesc: result.resultDesc });
    } else {
      await failMpesaTransaction(txn, result.resultCode, result.resultDesc);
    }
    resolved++;
  }

  return NextResponse.json({ checked: stuck.length, resolved });
}

export const POST = withJobSignature(handler);
