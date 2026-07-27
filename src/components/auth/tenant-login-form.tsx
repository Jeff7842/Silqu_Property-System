"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInTenantAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";

export function TenantLoginForm() {
  const [state, formAction, pending] = useActionState(signInTenantAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Email Address"
        icon="email"
        name="email"
        type="email"
        placeholder="name@example.com"
        required
      />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink">Password</label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput name="password" placeholder="••••••••" required />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 w-full">
        Sign In to Portal
      </Button>
    </form>
  );
}
