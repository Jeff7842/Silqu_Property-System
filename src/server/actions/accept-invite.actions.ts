"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { hashPassword, hashToken } from "@/server/auth/password";
import { logAudit } from "@/server/services/audit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Use at least 8 characters."),
});

export type AcceptInviteState = { error?: string; success?: boolean } | undefined;

export async function acceptInviteAction(
  _prevState: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const tokenHash = hashToken(parsed.data.token);
  const invitation = await db.invitation.findUnique({ where: { tokenHash } });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return { error: "This invitation is invalid or has expired. Ask your property manager to resend it." };
  }
  if (!invitation.tenantId) {
    return { error: "This invitation isn't linked to a tenant record." };
  }

  const existingUser = await db.user.findUnique({ where: { email: invitation.email } });
  if (existingUser) {
    return { error: "An account with that email already exists. Try signing in instead." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const userId = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        orgId: invitation.orgId,
        email: invitation.email,
        fullName: (await tx.tenant.findUniqueOrThrow({ where: { id: invitation.tenantId! } })).fullName,
        passwordHash,
        role: "TENANT",
      },
    });
    await tx.tenant.update({ where: { id: invitation.tenantId! }, data: { userId: user.id } });
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return user.id;
  });
  logAudit({
    orgId: invitation.orgId,
    actorUserId: userId,
    action: "invitation.accepted",
    entityType: "Invitation",
    entityId: invitation.id,
  });

  return { success: true };
}
