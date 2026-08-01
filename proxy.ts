import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { baseAuthConfig } from "@/server/auth/config";
import { PORTAL_CONFIG, resolvePortal, type Portal } from "@/server/auth/portals";

// Middleware only needs to read the signed JWT session cookie. Keep this
// separate from the full route-handler auth modules so proxy does not import
// credential providers, Prisma, Neon, or WebSocket code into the request gate.
const portalAuth: Record<Portal, ReturnType<typeof NextAuth>["auth"]> = {
  business: NextAuth(baseAuthConfig("business")).auth,
  tenant: NextAuth(baseAuthConfig("tenant")).auth,
  platform: NextAuth(baseAuthConfig("platform")).auth,
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
