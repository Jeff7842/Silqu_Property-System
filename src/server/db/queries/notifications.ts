import { db } from "@/server/db/client";

export function listNotifications(userId: string, limit = 10) {
  return db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
}

export function countUnreadNotifications(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
