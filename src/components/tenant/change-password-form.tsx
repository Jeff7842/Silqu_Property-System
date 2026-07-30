"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/server/actions/profile.actions";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const { push } = useToast();

  useEffect(() => {
    // Out of scope to force a re-login after a self-service password change,
    // so just confirm via toast and let the tenant keep browsing signed in.
    if (state?.success) {
      push("Password changed.", "success");
      formRef.current?.reset();
    }
  }, [state?.success, push]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <PasswordInput label="Current password" name="currentPassword" required />
      <PasswordInput label="New password" name="newPassword" placeholder="At least 8 characters" required />
      <PasswordInput label="Confirm new password" name="confirmPassword" required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="self-start">
        Change password
      </Button>
    </form>
  );
}
