"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createUnitAction } from "@/server/actions/property.actions";

export function UnitForm({ propertyId }: { propertyId: string }) {
  const [state, formAction, pending] = useActionState(createUnitAction.bind(null, propertyId), undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(`/app/properties/${propertyId}`);
  }, [state?.success, propertyId, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="Unit label" name="label" placeholder="A1" required />
      <Input label="Unit type" name="unitType" placeholder="1 Bedroom" required />
      <Input label="Bedrooms" name="bedrooms" type="number" min={0} max={20} defaultValue={1} required />
      <Input label="Rent (KES / month)" name="rentKES" type="number" min={1} step="0.01" required />
      <Input label="Deposit (KES)" name="depositKES" type="number" min={0} step="0.01" required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 self-start">
        Add unit
      </Button>
    </form>
  );
}
