import { NextResponse } from "next/server";
import { generateAndStoreReceipt } from "@/server/services/billing/generate-receipt";
import { withJobSignature } from "@/server/services/queue/verify";

async function handler(req: Request) {
  const { paymentId } = await req.json();
  if (!paymentId) return NextResponse.json({ error: "Missing paymentId" }, { status: 200 });

  await generateAndStoreReceipt(paymentId);
  return NextResponse.json({ ok: true });
}

export const POST = withJobSignature(handler);
