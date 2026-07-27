import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { Role } from "@/generated/prisma/client";

/**
 * These take an already-resolved session rather than calling auth()
 * internally, because "which auth()" depends on which portal's module the
 * caller imported (business.ts / tenant.ts / platform.ts) — there is no
 * single global auth() that would be correct here.
 *
 *   const session = await auth(); // from @/server/auth/business
 *   const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
 */

export function requireUser(session: Session | null) {
  if (!session?.user) redirect("/login");
  return session.user;
}

export function requireRole(session: Session | null, roles: Role[]) {
  const user = requireUser(session);
  if (!roles.includes(user.role)) redirect("/login?reason=forbidden");
  return user;
}

export function requireOrg(session: Session | null) {
  const user = requireUser(session);
  if (!user.orgId) redirect("/login?reason=no-org");
  return user.orgId;
}
