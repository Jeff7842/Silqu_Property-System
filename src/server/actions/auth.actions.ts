"use server";

import { AuthError } from "next-auth";
import { signIn as signInBusiness } from "@/server/auth/business";
import { signIn as signInTenant } from "@/server/auth/tenant";
import { loginSchema } from "@/server/validators/auth.schema";

export type LoginState = { error?: string } | undefined;

async function login(
  signIn: typeof signInBusiness,
  redirectTo: string,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo });
  } catch (error) {
    // signIn() redirects via a thrown NEXT_REDIRECT on success — only an
    // AuthError means the credentials were actually rejected.
    if (error instanceof AuthError) {
      return { error: "Email or password is incorrect." };
    }
    throw error;
  }
}

export async function signInBusinessAction(_prevState: LoginState, formData: FormData) {
  return login(signInBusiness, "/app", formData);
}

export async function signInTenantAction(_prevState: LoginState, formData: FormData) {
  return login(signInTenant, "/my", formData);
}
