import { NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const runtime = "nodejs";

const ACK = () => NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

// Safaricom's timeout URL: the request queue timed out before the customer
// actioned the prompt. Distinct from a callback with a non-zero ResultCode :
// this fires when no response ever came at all.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const checkoutRequestId = body?.Body?.stkCallback?.CheckoutRequestID ?? body?.CheckoutRequestID;
  if (!checkoutRequestId) return ACK();

  const txn = await db.mpesaTransaction.findUnique({ where: { checkoutRequestId } });
  if (!txn || txn.status !== "INITIATED") return ACK();

  await db.mpesaTransaction.update({
    where: { id: txn.id },
    data: { status: "TIMEOUT", resultDesc: "Request timed out : the customer did not action the prompt in time.", rawCallback: body },
  });

  return ACK();
}
