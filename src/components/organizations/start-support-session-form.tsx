"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { startSupportSessionAction, type ActionState } from "@/server/actions/support-session.actions";

export function StartSupportSessionForm({ orgId }: { orgId: string }) {
  const action = async (prev: ActionState, formData: FormData) => startSupportSessionAction(orgId, prev, formData);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Textarea
        name="reason"
        label="Reason for viewing this organization"
        placeholder="e.g. Investigating support ticket #482 — tenant reports a missing payment"
        rows={3}
        required
      />
      <Button type="submit" loading={pending} className="self-start">
        Start support session
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
