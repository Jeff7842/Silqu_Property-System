import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { baseAuthConfig } from "@/server/auth/config";
import { authorizeCredentials } from "@/server/auth/authorize";

// ponytail: TOTP second factor (build plan section 3.3) is not implemented
// yet : no Platform portal screens exist in the Stitch design to build a
// verification step against, and the platform console itself is Phase 9.
// This wires the same credentials pattern as the other two portals so
// middleware/session plumbing is ready; add the TOTP step when the portal
// itself gets built.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig("platform"),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) =>
        authorizeCredentials("platform", credentials?.email, credentials?.password),
    }),
  ],
});
