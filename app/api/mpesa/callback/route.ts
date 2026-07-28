import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { processStkCallbackBody } from "@/server/services/mpesa/process-callback";
import { acquireLock } from "@/server/services/redis/lock";
import type { Prisma } from "@/generated/prisma/client";

// Safaricom retries a callback that doesn't get a 200 back — and even a 200
// can arrive more than once for the same transaction. Both are normal, not
// errors: every path below must be safe to run twice.
const ACK = () => NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

export async function POST(req: Request) {
  const raw = await req.text();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    console.error("[mpesa-callback] unparseable body:", raw);
    return ACK();
  }

  const checkoutRequestId = (body as { Body?: { stkCallback?: { CheckoutRequestID?: string } } }).Body?.stkCallback?.CheckoutRequestID;
  if (!checkoutRequestId) {
    console.error("[mpesa-callback] no CheckoutRequestID in body:", raw);
    return ACK();
  }

  const txn = await db.mpesaTransaction.findUnique({ where: { checkoutRequestId } });
  if (!txn) {
    console.error("[mpesa-callback] no matching transaction for", checkoutRequestId);
    return ACK();
  }

  // Log the raw callback before anything else, no matter what happens next —
  // in payments, the raw record is sacred evidence.
  await db.mpesaTransaction.update({ where: { id: txn.id }, data: { rawCallback: body as Prisma.InputJsonValue } });

  // Database backstop: already-completed transactions are always a no-op.
  if (txn.status === "COMPLETED") return ACK();

  // Redis idempotency gate: stops a second concurrent delivery from
  // reprocessing before the first one has even finished (the unique
  // checkoutRequestId column above is the absolute guarantee; this just
  // avoids the redundant work while Redis is up).
  const firstDelivery = await acquireLock(`idem:mpesa:${checkoutRequestId}`, 86_400);
  if (!firstDelivery) return ACK();

  await processStkCallbackBody(txn, body);

  return ACK();
}
