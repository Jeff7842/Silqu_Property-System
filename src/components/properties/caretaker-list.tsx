"use client";

import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { unassignCaretakerAction } from "@/server/actions/property.actions";

type Caretaker = { id: string; fullName: string };
type Unit = { id: string; label: string };
type Assignment = { id: string; unitId: string | null; user: Caretaker };

export function CaretakerList({
  propertyId,
  units,
  assignments,
}: {
  propertyId: string;
  units: Unit[];
  assignments: Assignment[];
}) {
  const { push } = useToast();

  if (assignments.length === 0) {
    return <p className="text-sm text-ink-muted">No caretakers assigned yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((a) => (
        <li key={a.id} className="flex items-center justify-between rounded-[--radius-control] border border-line px-3 py-2 text-sm">
          <span>
            {a.user.fullName}{" "}
            <span className="text-ink-muted">: {a.unitId ? units.find((u) => u.id === a.unitId)?.label ?? "unit" : "whole property"}</span>
          </span>
          <form
            action={async () => {
              await unassignCaretakerAction(a.id, propertyId);
              push("Caretaker unassigned.", "success");
            }}
          >
            <button type="submit" className="text-ink-muted hover:text-danger" aria-label="Remove assignment">
              <Icon name="delete" size={18} />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
