"use server";

import { db } from "@/server/db/client";
import { auth } from "@/server/auth/tenant";
import { requireRole } from "@/server/auth/session";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import { logAudit } from "@/server/services/audit";
import { changePasswordSchema } from "@/server/validators/profile.schema";

export type ActionState = { error?: string; success?: boolean } | undefined;

/**
 * Changes the signed-in tenant's own NextAuth password.
 * @param formData - currentPassword, newPassword, confirmPassword.
 * @returns { success: true } on success, or { error } describing what to fix.
 * @throws Never : all failures are returned as structured ActionState, since
 *   this is a form action and the UI needs a message, not a thrown error.
 * Why it exists: tenants have no self-service way to rotate a compromised or
 * forgotten-but-still-known password without going through the manager.
 */
export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  // Own-user-id only : the id comes from the session, never from the client,
  // so there's no capability check beyond "is this a signed-in tenant".
  const user = requireRole(session, ["TENANT"]);

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Account not found." };

  const isCurrentPasswordValid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!isCurrentPasswordValid) return { error: "Current password is incorrect." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  logAudit({ orgId: dbUser.orgId, actorUserId: user.id, action: "password.change", entityType: "User", entityId: user.id });

  return { success: true };
}
