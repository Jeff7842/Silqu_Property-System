"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateUnitStatusAction } from "@/server/actions/property.actions";

const STATUSES = ["VACANT", "OCCUPIED", "MAINTENANCE", "RESERVED"] as const;

export function UnitStatusForm({ unitId, currentStatus }: { unitId: string; currentStatus: string }) {
  const [state, formAction, pending] = useActionState(updateUnitStatusAction.bind(null, unitId), undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <Select name="status" defaultValue={currentStatus} label="Status">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" loading={pending}>
        Update
      </Button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
