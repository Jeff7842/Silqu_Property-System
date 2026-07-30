import { db } from "@/server/db/client";
import { publishJob } from "@/server/services/queue/client";

/**
 * One fan-out function for every notification event: writes the in-app
 * Notification row and queues the matching email. Call this from server
 * actions, never scatter ad-hoc "send an email" calls through UI code.
 */
export async function notify(userId: string, event: { type: string; title: string; body: string; link?: string }) {
  const notification = await db.notification.create({
    data: { userId, type: event.type, title: event.title, body: event.body, link: event.link },
  });
  await publishJob("/api/jobs/send-notification-email", { notificationId: notification.id });
  return notification;
}
