"use client";

import { useActionState } from "react";
import { signInPlatformAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";

export function PlatformLoginForm() {
  const [state, formAction, pending] = useActionState(signInPlatformAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Email Address"
        icon="email"
        name="email"
        type="email"
        placeholder="admin@silqu.co.ke"
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Password</label>
        <PasswordInput name="password" placeholder="••••••••" required />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 w-full">
        Sign In
      </Button>
    </form>
  );
}
