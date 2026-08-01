import type { Role } from "@/generated/prisma/client";

export type Portal = "business" | "tenant" | "platform";

export const PORTAL_CONFIG: Record<
  Portal,
  { cookieName: string; maxAgeSeconds: number; allowedRoles: Role[]; loginPath: string }
> = {
  business: {
    cookieName: "silqu.biz",
    maxAgeSeconds: 8 * 60 * 60,
    allowedRoles: ["MANAGER", "EMPLOYEE", "CARETAKER"],
    loginPath: "/login",
  },
  tenant: {
    cookieName: "silqu.my",
    maxAgeSeconds: 30 * 24 * 60 * 60,
    allowedRoles: ["TENANT"],
    loginPath: "/my/login",
  },
  platform: {
    cookieName: "silqu.platform",
    // Auth.js has no separate idle timeout : a short maxAge + matching
    // updateAge approximates "expires 15 minutes after last activity".
    maxAgeSeconds: 15 * 60,
    allowedRoles: ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"],
    loginPath: "/platform/login",
  },
};

/** Resolves which portal a request belongs to. Path-based in dev (no subdomains on localhost); host-based in production per build plan section 3.4. */
export function resolvePortal(pathname: string, host: string): Portal {
  if (process.env.NODE_ENV === "production") {
    if (host.startsWith("platform.")) return "platform";
    if (host.startsWith("my.")) return "tenant";
    return "business";
  }
  if (pathname.startsWith("/platform")) return "platform";
  if (pathname.startsWith("/my")) return "tenant";
  return "business";
}
