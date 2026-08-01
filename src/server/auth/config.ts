import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Portal } from "@/server/auth/portals";
import { PORTAL_CONFIG } from "@/server/auth/portals";

/**
 * Shared by all three portals' full NextAuth() instances (business.ts,
 * tenant.ts, platform.ts). src/proxy.ts imports and reuses those same
 * `auth` exports rather than creating its own : six separate NextAuth()
 * instances in one process (three here + three more in proxy.ts) was the
 * actual cause of sessions never surviving the post-sign-in redirect: the
 * jwt/session callbacks decoded correctly, cookies().set() ran, but the
 * session middleware checked never matched up with the one sign-in wrote.
 */
export function baseAuthConfig(portal: Portal): NextAuthConfig {
  const { cookieName, maxAgeSeconds, loginPath } = PORTAL_CONFIG[portal];

  return {
    basePath: `/api/auth/${portal}`,
    // Without this, Auth.js rejects the Host header it needs to build its
    // internal sign-in URL whenever the app isn't on a fixed AUTH_URL :
    // which is always true in dev, since the port varies (3000 vs 3001).
    trustHost: true,
    session: {
      strategy: "jwt",
      maxAge: maxAgeSeconds,
      updateAge: portal === "platform" ? maxAgeSeconds : undefined,
    },
    pages: {
      signIn: loginPath,
    },
    cookies: {
      sessionToken: {
        name: cookieName,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.id = user.id!;
          token.orgId = user.orgId ?? null;
          token.role = user.role;
          token.subRole = user.subRole ?? null;
          token.portal = portal;
          token.fullName = user.fullName!;
        }
        return token;
      },
      session({ session, token }) {
        const t = token as JWT;
        session.user.id = t.id;
        session.user.orgId = t.orgId;
        session.user.role = t.role;
        session.user.subRole = t.subRole;
        session.user.portal = t.portal;
        session.user.fullName = t.fullName;
        return session;
      },
    },
    providers: [],
  };
}
