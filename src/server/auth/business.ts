import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { baseAuthConfig } from "@/server/auth/config";
import { authorizeCredentials } from "@/server/auth/authorize";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig("business"),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) =>
        authorizeCredentials("business", credentials?.email, credentials?.password),
    }),
  ],
});
