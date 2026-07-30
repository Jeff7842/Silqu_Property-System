"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { logAudit } from "@/server/services/audit";
import { startSupportSession } from "@/server/services/redis/support-session";

export type ActionState = { error?: string; success?: boolean } | undefined;

// Force an actual explanation ("checking" isn't one) — this reason is what
// makes a support session defensible later, since it's the only thing that
// distinguishes "platform staff looking at a tenant's rent history" from a
// breach.
const REASON_MIN_LENGTH = 10;

export async function startSupportSessionAction(orgId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);
  if (!hasAccess(user, "startSupportSession")) return { error: "You don't have permission to start a support session." };

  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < REASON_MIN_LENGTH) {
    return { error: `Give a reason (at least ${REASON_MIN_LENGTH} characters) — this is recorded in the audit log.` };
  }

  await startSupportSession(user.id, orgId, reason);
  logAudit({
    orgId,
    actorUserId: user.id,
    action: "support.session.started",
    entityType: "Organization",
    entityId: orgId,
    after: { reason },
  });

  revalidatePath(`/platform/organizations/${orgId}`);
  return { success: true };
}
