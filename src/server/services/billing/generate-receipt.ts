import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/server/db/client";
import { r2, R2_BUCKET_PRIVATE } from "@/server/services/r2/client";
import { renderReceiptPdf } from "@/server/services/pdf/receipt";
import { escapeHtml, sendEmail } from "@/server/services/email/client";

/**
 * Called right after a payment's allocation transaction commits (never inside
 * it : PDF rendering + upload has no place holding a database transaction open).
 * Shared by the record-payment action (calls it directly, since QStash isn't
 * provisioned in dev) and the /api/jobs/send-receipt job (for when it is).
 */
export async function generateAndStoreReceipt(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { tenant: true, lease: { include: { unit: { include: { property: true } } } } },
  });
  if (!payment || !payment.recordedById) return null;

  const org = await db.organization.findUnique({ where: { id: payment.orgId }, select: { name: true } });

  const pdf = await renderReceiptPdf({
    orgName: org?.name ?? "SILQU",
    receiptNo: `RCT-${payment.id.slice(-8).toUpperCase()}`,
    tenantName: payment.tenant.fullName,
    unitLabel: payment.lease.unit.label,
    propertyName: payment.lease.unit.property.name,
    method: payment.method,
    reference: payment.reference ?? payment.mpesaReceipt,
    paidAt: payment.paidAt,
    amountCents: payment.amountCents,
  });

  if (!r2) {
    console.log(`[receipt] storage not configured : generated ${pdf.length}-byte PDF for payment ${paymentId} but couldn't store it`);
    return null;
  }

  const key = `${payment.orgId}/receipts/${paymentId}.pdf`;
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET_PRIVATE, Key: key, Body: pdf, ContentType: "application/pdf" }));

  const doc = await db.document.create({
    data: { orgId: payment.orgId, entityType: "PAYMENT", entityId: paymentId, kind: "RECEIPT", fileKey: key, isPrivate: true, uploadedById: payment.recordedById },
  });

  if (payment.tenant.email) {
    const downloadLink = `${process.env.QSTASH_TARGET_BASE_URL ?? ""}/api/documents/${doc.id}/download`;
    console.log(`[receipt] ${payment.tenant.email} -> ${downloadLink}`);
    await sendEmail({
      to: payment.tenant.email,
      subject: `Your SILQU payment receipt : ${payment.lease.unit.label}`,
      template: "payment-receipt",
      orgId: payment.orgId,
      html: `<p>Hi ${escapeHtml(payment.tenant.fullName)},</p><p>We've recorded your payment of KES ${(payment.amountCents / 100).toLocaleString("en-KE")} for ${escapeHtml(payment.lease.unit.label)}.</p><p><a href="${downloadLink}">Download your receipt</a></p>`,
    });
  }

  return doc;
}
