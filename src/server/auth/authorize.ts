import { headers } from "next/headers";
import { db } from "@/server/db/client";
import { verifyPassword } from "@/server/auth/password";
import { PORTAL_CONFIG, type Portal } from "@/server/auth/portals";
import { isLoginRateLimited } from "@/server/services/redis/ratelimit";
import { logAudit } from "@/server/services/audit";

/**
 * Shared credential check for all three portals. Deliberately returns the
 * same generic failure for "no such user" and "wrong password" — telling
 * the two apart is an account-enumeration tool.
 */
export async function authorizeCredentials(
  portal: Portal,
  email: unknown,
  password: unknown,
) {
  if (typeof email !== "string" || typeof password !== "string") return null;
  const normalizedEmail = email.toLowerCase();
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";

  if (await isLoginRateLimited(normalizedEmail, ip)) return null;

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    include: { employeeProfile: true },
  });

  const fail = () => {
    logAudit({
      orgId: user?.orgId,
      actorUserId: user?.id,
      action: "login.failure",
      entityType: "User",
      entityId: user?.id,
      after: { email: normalizedEmail, portal, ip },
    });
    return null;
  };

  if (!user || user.status !== "ACTIVE") return fail();
  if (!PORTAL_CONFIG[portal].allowedRoles.includes(user.role)) return fail();

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail();

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  logAudit({
    orgId: user.orgId,
    actorUserId: user.id,
    action: "login.success",
    entityType: "User",
    entityId: user.id,
    after: { portal, ip },
  });

  return {
    id: user.id,
    orgId: user.orgId,
    role: user.role,
    subRole: user.employeeProfile?.subRole ?? null,
    email: user.email,
    fullName: user.fullName,
  };
}
