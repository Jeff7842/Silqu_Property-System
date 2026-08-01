"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { logAudit } from "@/server/services/audit";

export type ActionState = { error?: string; success?: boolean } | undefined;

/**
 * Toggles an org between ACTIVE and SUSPENDED. Archived orgs are left alone
 * : reactivating an archive isn't this button's job. `authorizeCredentials`
 * (src/server/auth/authorize.ts) checks org.status on every sign-in across
 * all three portals, so a SUSPENDED org's staff and tenants are locked out
 * immediately.
 */
export async function toggleOrganizationStatusAction(orgId: string): Promise<ActionState> {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN"]);

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { id: true, status: true } });
  if (!org) return { error: "Organization not found." };
  if (org.status === "ARCHIVED") return { error: "Archived organizations can't be suspended or reactivated here." };

  const nextStatus = org.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  await db.organization.update({ where: { id: orgId }, data: { status: nextStatus } });
  logAudit({
    orgId,
    actorUserId: user.id,
    action: nextStatus === "SUSPENDED" ? "organization.suspended" : "organization.reactivated",
    entityType: "Organization",
    entityId: orgId,
    before: { status: org.status },
    after: { status: nextStatus },
  });

  revalidatePath("/platform/organizations");
  return { success: true };
}
