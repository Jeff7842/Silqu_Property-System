"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { setPasswordAction } from "@/server/actions/password-reset.actions";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function SetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, formAction, pending] = useActionState(setPasswordAction, undefined);

  if (state?.success) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-success">
        <Icon name="success" size={18} />
        Password set.{" "}
        <Link href="/login" className="font-medium underline">
          Sign in
        </Link>
      </p>
    );
  }

  if (!token) {
    return <p className="text-sm text-danger">This link is missing its reset token.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <PasswordInput label="New password" name="password" placeholder="At least 8 characters" required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full">
        Set password
      </Button>
    </form>
  );
}
