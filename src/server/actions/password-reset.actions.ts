"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { generateToken, hashPassword, hashToken } from "@/server/auth/password";
import { isPasswordResetRateLimited } from "@/server/services/redis/ratelimit";
import { logAudit } from "@/server/services/audit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const emailSchema = z.string().trim().toLowerCase().email();
const newPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Use at least 8 characters."),
});

export type ForgotPasswordState = { sent?: boolean } | undefined;

export async function requestPasswordResetAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  // Always report success — confirming/denying an email exists is an
  // account-enumeration tool, same reasoning as the login error message.
  if (!parsed.success) return { sent: true };
  if (await isPasswordResetRateLimited(parsed.data)) return { sent: true };

  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const { raw, hash } = generateToken();
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });
    // ponytail: Resend integration is a later phase — log the link so the
    // flow is testable end to end without an email provider wired up yet.
    console.log(`[password-reset] ${user.email} -> /set-password?token=${raw}`);
  }

  return { sent: true };
}

export type SetPasswordState = { error?: string; success?: boolean } | undefined;

export async function setPasswordAction(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const tokenHash = hashToken(parsed.data.token);
  const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);
  logAudit({
    actorUserId: resetToken.userId,
    action: "password.change",
    entityType: "User",
    entityId: resetToken.userId,
  });

  return { success: true };
}
