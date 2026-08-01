import { Resend } from "resend";
import { db } from "@/server/db/client";

/** Undefined until RESEND_API_KEY is set : not provisioned yet. sendEmail() falls back to logging. */
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : undefined;

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  /** Machine-readable name for the EmailLog row, e.g. "password-reset", "tenant-invitation". */
  template: string;
  /** Org this email belongs to, for scoping EmailLog reads. Platform-level emails (e.g. contact form) omit this. */
  orgId?: string | null;
  /** Lets replies from a notification email reach the person it's about, without exposing their address as the sender. */
  replyTo?: string;
};

/**
 * Sends a transactional email via Resend, or no-ops (logs) if Resend isn't
 * configured : same "absent env var -> skip" shape as mpesa/client.ts and
 * queue/client.ts's publishJob, so this activates automatically the moment
 * RESEND_API_KEY and RESEND_FROM_EMAIL are set, with no code change needed.
 *
 * Every attempt is written to EmailLog (SENT or FAILED), mirroring how
 * M-Pesa transactions are recorded : support needs to see what was sent to
 * a tenant without grepping Vercel logs.
 *
 * @param params.to - recipient address
 * @param params.subject - email subject line
 * @param params.html - email body as plain, functional HTML (no design tokens apply here)
 * @param params.template - machine-readable template name, recorded on EmailLog for auditing
 * @returns the Resend message id, or null if unconfigured or the send failed
 */
export async function sendEmail(params: SendEmailParams): Promise<string | null> {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.log(`[email] Resend not configured : skipping send to ${params.to}: ${params.subject}`);
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });

    if (result.error) {
      console.error(`[email] send to ${params.to} failed:`, result.error.message);
      await writeEmailLog(params, "FAILED", null, result.error.message);
      return null;
    }

    const providerId = result.data?.id ?? null;
    await writeEmailLog(params, "SENT", providerId, null);
    return providerId;
  } catch (err) {
    // Network/SDK-level failure, distinct from an API-level error response above.
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[email] send to ${params.to} threw:`, message);
    await writeEmailLog(params, "FAILED", null, message);
    return null;
  }
}

/** Escapes free-text values before they're interpolated into an email's HTML body : the email HTML has no template engine doing this for us. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Fire-and-forget, matching logAudit()'s pattern : a logging write must never block or fail the send it's recording. */
function writeEmailLog(params: SendEmailParams, status: "SENT" | "FAILED", providerId: string | null, error: string | null) {
  return db.emailLog
    .create({
      data: {
        orgId: params.orgId ?? null,
        to: params.to,
        template: params.template,
        providerId,
        status,
        error,
        sentAt: status === "SENT" ? new Date() : null,
      },
    })
    .catch((err) => console.error("[email] failed to write EmailLog:", err));
}
