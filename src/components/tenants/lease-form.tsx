"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fromCents } from "@/lib/money";
import { createLeaseAction } from "@/server/actions/lease.actions";

type VacantUnit = { id: string; label: string; rentCents: number; depositCents: number; property: { name: string } };

export function LeaseForm({ tenantId, units }: { tenantId: string; units: VacantUnit[] }) {
  const [state, formAction, pending] = useActionState(createLeaseAction.bind(null, tenantId), undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(`/app/tenants/${tenantId}`);
  }, [state?.success, tenantId, router]);

  if (units.length === 0) {
    return <p className="text-sm text-ink-muted">No vacant units available. Free up a unit or add a new one first.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const inOneYear = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Select
        label="Unit"
        name="unitId"
        required
        onChange={(e) => {
          const unit = units.find((u) => u.id === e.target.value);
          const form = e.target.form!;
          (form.elements.namedItem("rentKES") as HTMLInputElement).value = unit ? String(fromCents(unit.rentCents)) : "";
          (form.elements.namedItem("depositKES") as HTMLInputElement).value = unit ? String(fromCents(unit.depositCents)) : "";
        }}
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.property.name} — {u.label}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Start date" name="startDate" type="date" defaultValue={today} required />
        <Input label="End date" name="endDate" type="date" defaultValue={inOneYear} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Rent (KES / month)" name="rentKES" type="number" min={1} step="0.01" defaultValue={fromCents(units[0].rentCents)} required />
        <Input label="Deposit (KES)" name="depositKES" type="number" min={0} step="0.01" defaultValue={fromCents(units[0].depositCents)} required />
      </div>
      <Input label="Billing day (day of month rent is due)" name="billingDay" type="number" min={1} max={28} defaultValue={1} required />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 self-start">
        Create lease
      </Button>
    </form>
  );
}
