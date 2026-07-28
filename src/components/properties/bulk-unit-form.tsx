"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bulkCreateUnitsAction } from "@/server/actions/property.actions";

export function BulkUnitForm({ propertyId }: { propertyId: string }) {
  const [state, formAction, pending] = useActionState(bulkCreateUnitsAction.bind(null, propertyId), undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(`/app/properties/${propertyId}`);
  }, [state?.success, propertyId, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        Creates a range of units in one go, e.g. prefix <span className="font-semibold text-ink">A</span> from{" "}
        <span className="font-semibold text-ink">1</span> to <span className="font-semibold text-ink">12</span> creates A1&ndash;A12.
      </p>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Label prefix" name="prefix" placeholder="A" required />
        <Input label="Start number" name="startNumber" type="number" min={1} defaultValue={1} required />
        <Input label="End number" name="endNumber" type="number" min={1} defaultValue={12} required />
      </div>
      <Input label="Unit type" name="unitType" placeholder="1 Bedroom" required />
      <Input label="Bedrooms" name="bedrooms" type="number" min={0} max={20} defaultValue={1} required />
      <Input label="Rent (KES / month, shared)" name="rentKES" type="number" min={1} step="0.01" required />
      <Input label="Deposit (KES, shared)" name="depositKES" type="number" min={0} step="0.01" required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 self-start">
        Create units
      </Button>
    </form>
  );
}
