import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { withJobSignature } from "@/server/services/queue/verify";

// ponytail: Resend integration is a later phase — log instead of sending,
// same pattern as password-reset/invitation emails. Idempotent by nature:
// logging twice has no side effect.
async function handler(req: Request) {
  const { invoiceId } = await req.json();
  if (!invoiceId) return NextResponse.json({ error: "Missing invoiceId" }, { status: 200 });

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { lease: { include: { tenant: true } } },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 200 });

  const email = invoice.lease.tenant.email;
  if (email) {
    console.log(`[invoice-email] ${email} -> invoice ${invoice.invoiceNo} (KES ${invoice.totalCents / 100})`);
  }

  return NextResponse.json({ ok: true });
}

export const POST = withJobSignature(handler);
