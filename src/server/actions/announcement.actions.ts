"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { logAudit } from "@/server/services/audit";
import { notify } from "@/server/services/notifications/notify";
import { resolveAnnouncementRecipients } from "@/server/db/queries/announcements";
import { announcementSchema } from "@/server/validators/announcement.schema";

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function publishAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);
  if (!hasAccess(user, "publishAnnouncement")) return { error: "You don't have permission to publish announcements." };

  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { title, body, audience, propertyId, unitId } = parsed.data;

  const announcement = await db.announcement.create({
    data: {
      orgId,
      title,
      body,
      audience,
      propertyId: audience === "PROPERTY" ? propertyId : null,
      unitId: audience === "UNIT" ? unitId : null,
      createdById: user.id,
      publishedAt: new Date(),
    },
  });

  logAudit({ orgId, actorUserId: user.id, action: "announcement.published", entityType: "Announcement", entityId: announcement.id });

  const recipientIds = await resolveAnnouncementRecipients(orgId, { audience, propertyId, unitId });
  await Promise.all(
    recipientIds.map((userId) =>
      notify(userId, { type: "announcement.published", title: "New announcement", body: title, link: "/my" }),
    ),
  );

  revalidatePath("/app/announcements");
  revalidatePath("/my");
  return { success: true };
}
