import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { withJobSignature } from "@/server/services/queue/verify";
import { escapeHtml, sendEmail } from "@/server/services/email/client";

// Idempotent by nature: re-sending the same invoice notification twice has
// no destructive side effect, only a duplicate email — acceptable for a job
// that QStash may retry.
async function handler(req: Request) {
  const { invoiceId } = await req.json();
  if (!invoiceId) return NextResponse.json({ error: "Missing invoiceId" }, { status: 200 });

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { lease: { include: { tenant: true, unit: true } } },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 200 });

  const email = invoice.lease.tenant.email;
  if (email) {
    console.log(`[invoice-email] ${email} -> invoice ${invoice.invoiceNo} (KES ${invoice.totalCents / 100})`);
    await sendEmail({
      to: email,
      subject: `New invoice ${invoice.invoiceNo} — SILQU`,
      template: "invoice-notification",
      orgId: invoice.orgId,
      html: `<p>Hi ${escapeHtml(invoice.lease.tenant.fullName)},</p><p>A new invoice has been issued for ${escapeHtml(invoice.lease.unit.label)}.</p><p>Invoice ${escapeHtml(invoice.invoiceNo)}: KES ${(invoice.totalCents / 100).toLocaleString("en-KE")}</p><p>Sign in to your tenant portal to view details and pay.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}

export const POST = withJobSignature(handler);
