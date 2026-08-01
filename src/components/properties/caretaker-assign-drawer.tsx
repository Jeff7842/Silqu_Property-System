"use client";

import { useActionState, useEffect } from "react";
import { Drawer, DrawerTrigger, closeOverlay } from "@/components/ui/drawer";
import { Select } from "@/components/ui/select";
import { Button, buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { assignCaretakerAction } from "@/server/actions/property.actions";

type Caretaker = { id: string; fullName: string };
type Unit = { id: string; label: string };

export function CaretakerAssignDrawer({
  propertyId,
  caretakers,
  units,
}: {
  propertyId: string;
  caretakers: Caretaker[];
  units: Unit[];
}) {
  const { push } = useToast();
  const id = `add-caretaker-drawer-${propertyId}`;
  const [state, formAction, pending] = useActionState(assignCaretakerAction.bind(null, propertyId), undefined);

  useEffect(() => {
    if (state?.success) {
      push("Caretaker assigned.", "success");
      closeOverlay(id);
    }
  }, [state?.success, id, push]);

  if (caretakers.length === 0) {
    return <p className="text-sm text-ink-muted">No caretaker accounts exist in your organization yet.</p>;
  }

  return (
    <>
      <DrawerTrigger targetId={id} className={buttonClass("secondary", "sm")}>
        Add caretaker
      </DrawerTrigger>
      <Drawer
        id={id}
        title="Add caretaker"
        footer={
          <Button
            type="submit"
            form="caretaker-assign-form"
            variant="secondary"
            loading={pending}
            className="w-full"
          >
            Assign
          </Button>
        }
      >
        <form id="caretaker-assign-form" action={formAction} className="flex flex-col gap-4">
          <Select name="userId" label="Caretaker" className="w-full" required>
            {caretakers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </Select>
          <Select name="unitId" label="Scope" className="w-full">
            <option value="">Whole property</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </Select>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        </form>
      </Drawer>
    </>
  );
}
