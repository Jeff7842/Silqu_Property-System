"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth as authBusiness } from "@/server/auth/business";
import { auth as authTenant } from "@/server/auth/tenant";
import { auth as authPlatform } from "@/server/auth/platform";

/** Notifications are read across all three portals : try each portal's session cookie, whichever one is actually present wins. */
async function currentUserId() {
  const [b, t, p] = await Promise.all([authBusiness(), authTenant(), authPlatform()]);
  return (b ?? t ?? p)?.user?.id ?? null;
}

export async function markNotificationReadAction(notificationId: string) {
  const userId = await currentUserId();
  if (!userId) return;
  await db.notification.updateMany({ where: { id: notificationId, userId }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const userId = await currentUserId();
  if (!userId) return;
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
