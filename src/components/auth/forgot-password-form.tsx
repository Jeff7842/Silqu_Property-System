"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/server/actions/password-reset.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Icon name="email" size={48} className="text-primary" />
        <h2 className="text-lg font-semibold text-ink">Check your email</h2>
        <p className="text-sm text-ink-muted">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="Email Address" icon="email" name="email" type="email" placeholder="name@example.com" required />
      <Button type="submit" loading={pending} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
