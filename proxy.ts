import { NextResponse, type NextRequest } from "next/server";
import { auth as authBusiness } from "@/server/auth/business";
import { auth as authTenant } from "@/server/auth/tenant";
import { auth as authPlatform } from "@/server/auth/platform";
import { PORTAL_CONFIG, resolvePortal, type Portal } from "@/server/auth/portals";

// Reuses the SAME auth() instances as the route handlers/actions (not
// fresh NextAuth(baseAuthConfig(portal)) copies) : six separate NextAuth()
// instances in one process was the actual cause of sessions not surviving
// a redirect; see docs/SILQU_BUILD_PLAN_V2.md Phase 3 notes.
const portalAuth: Record<Portal, typeof authBusiness> = {
  business: authBusiness,
  tenant: authTenant,
  platform: authPlatform,
};

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/set-password",
  "/pricing",
  "/contact",
  "/design-system",
  "/my/login",
  "/my/accept-invite",
  "/platform/login",
];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/")
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const portal = resolvePortal(pathname, req.headers.get("host") ?? "");
  const session = await portalAuth[portal]();
  const { loginPath, allowedRoles } = PORTAL_CONFIG[portal];

  if (!session?.user) {
    const url = new URL(loginPath, req.url);
    url.searchParams.set("reason", "unauthenticated");
    return NextResponse.redirect(url);
  }

  if (!allowedRoles.includes(session.user.role)) {
    const url = new URL(loginPath, req.url);
    url.searchParams.set("reason", "forbidden");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
