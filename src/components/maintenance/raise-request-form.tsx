"use client";

import { useActionState, useEffect, useRef } from "react";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { raiseMaintenanceRequestAction } from "@/server/actions/maintenance.actions";

export function RaiseRequestForm() {
  const [state, formAction, pending] = useActionState(raiseMaintenanceRequestAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Select name="category" label="Category" required>
          <option value="PLUMBING">Plumbing</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="STRUCTURAL">Structural</option>
          <option value="SECURITY">Security</option>
          <option value="OTHER">Other</option>
        </Select>
        <Select name="priority" label="Priority" defaultValue="MEDIUM" required>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </Select>
      </div>
      <Textarea name="description" label="Describe the issue" rows={3} required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Request submitted.</p>}
      <Button type="submit" loading={pending} className="self-start">Submit request</Button>
    </form>
  );
}
