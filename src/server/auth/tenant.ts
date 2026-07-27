import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { baseAuthConfig } from "@/server/auth/config";
import { authorizeCredentials } from "@/server/auth/authorize";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig("tenant"),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) =>
        authorizeCredentials("tenant", credentials?.email, credentials?.password),
    }),
  ],
});
