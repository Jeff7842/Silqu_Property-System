import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { withJobSignature } from "@/server/services/queue/verify";
import { escapeHtml, sendEmail } from "@/server/services/email/client";

// The most-used email path: every notify() call in the app (announcements,
// maintenance assignment/resolution, payment confirmations, etc.) fans out
// here. Idempotent by nature — re-sending the same notification email has
// no destructive side effect, only a duplicate, which is fine for a
// QStash-retried job.
async function handler(req: Request) {
  const { notificationId } = await req.json();
  if (!notificationId) return NextResponse.json({ error: "Missing notificationId" }, { status: 200 });

  const notification = await db.notification.findUnique({ where: { id: notificationId }, include: { user: true } });
  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 200 });

  console.log(`[notification-email] ${notification.user.email} -> ${notification.title}`);

  const link = notification.link ? `${process.env.QSTASH_TARGET_BASE_URL ?? ""}${notification.link}` : null;
  await sendEmail({
    to: notification.user.email,
    subject: notification.title,
    template: "notification-fanout",
    orgId: notification.user.orgId,
    html: `<p>${escapeHtml(notification.body)}</p>${link ? `<p><a href="${link}">View in SILQU</a></p>` : ""}`,
  });

  return NextResponse.json({ ok: true });
}

export const POST = withJobSignature(handler);
