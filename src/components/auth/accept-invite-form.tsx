"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { acceptInviteAction } from "@/server/actions/accept-invite.actions";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function AcceptInviteForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, formAction, pending] = useActionState(acceptInviteAction, undefined);

  if (state?.success) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-success">
        <Icon name="success" size={18} />
        Account ready.{" "}
        <Link href="/my/login" className="font-medium underline">
          Sign in to your portal
        </Link>
      </p>
    );
  }

  if (!token) {
    return <p className="text-sm text-danger">This invitation link is missing its token.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <PasswordInput label="Choose a password" name="password" placeholder="At least 8 characters" required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full">
        Activate my account
      </Button>
    </form>
  );
}
