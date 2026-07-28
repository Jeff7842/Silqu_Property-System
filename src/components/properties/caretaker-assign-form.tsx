"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { assignCaretakerAction, unassignCaretakerAction } from "@/server/actions/property.actions";

type Caretaker = { id: string; fullName: string };
type Unit = { id: string; label: string };
type Assignment = { id: string; unitId: string | null; user: Caretaker };

export function CaretakerAssignForm({
  propertyId,
  caretakers,
  units,
  assignments,
}: {
  propertyId: string;
  caretakers: Caretaker[];
  units: Unit[];
  assignments: Assignment[];
}) {
  const [state, formAction, pending] = useActionState(assignCaretakerAction.bind(null, propertyId), undefined);

  return (
    <div className="flex flex-col gap-4">
      {assignments.length === 0 ? (
        <p className="text-sm text-ink-muted">No caretakers assigned yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {assignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-[--radius-control] border border-line px-3 py-2 text-sm">
              <span>
                {a.user.fullName}{" "}
                <span className="text-ink-muted">— {a.unitId ? units.find((u) => u.id === a.unitId)?.label ?? "unit" : "whole property"}</span>
              </span>
              <form action={async () => { await unassignCaretakerAction(a.id, propertyId); }}>
                <button type="submit" className="text-ink-muted hover:text-danger" aria-label="Remove assignment">
                  <Icon name="delete" size={18} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {caretakers.length === 0 ? (
        <p className="text-sm text-ink-muted">No caretaker accounts exist in your organization yet.</p>
      ) : (
        <form action={formAction} className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end">
          <Select name="userId" label="Caretaker" className="sm:w-48" required>
            {caretakers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </Select>
          <Select name="unitId" label="Scope" className="sm:w-48">
            <option value="">Whole property</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" loading={pending}>Assign</Button>
        </form>
      )}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </div>
  );
}
