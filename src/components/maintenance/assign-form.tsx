"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { assignMaintenanceAction } from "@/server/actions/maintenance.actions";

export function AssignForm({ requestId, caretakers }: { requestId: string; caretakers: { id: string; fullName: string }[] }) {
  const [state, formAction, pending] = useActionState(assignMaintenanceAction.bind(null, requestId), undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  if (caretakers.length === 0) return <p className="text-sm text-ink-muted">No caretaker accounts exist yet.</p>;

  return (
    <form action={formAction} className="flex items-end gap-2">
      <Select name="caretakerId" label="Assign to" className="flex-1" required>
        <option value="">Choose a caretaker</option>
        {caretakers.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
      </Select>
      <Button type="submit" variant="secondary" loading={pending}>Assign</Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
