"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import type { ActionState } from "@/server/actions/property.actions";

const PROPERTY_TYPES = ["APARTMENT", "BUNGALOW", "MAISONETTE", "COMMERCIAL", "OTHER"] as const;

export function PropertyForm({
  action,
  redirectTo,
  defaults,
  submitLabel = "Save property",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  redirectTo: string;
  defaults?: { name: string; county: string; town: string; address: string; type: string };
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(redirectTo);
  }, [state?.success, redirectTo, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="Property name" name="name" defaultValue={defaults?.name} placeholder="Kileleshwa Gardens" required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="County" name="county" defaultValue={defaults?.county ?? "Nairobi"} required>
          {KENYA_COUNTIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Input label="Town / estate" name="town" defaultValue={defaults?.town} placeholder="Kileleshwa" required />
      </div>
      <Input label="Street address" name="address" defaultValue={defaults?.address} placeholder="Argwings Kodhek Road" required />
      <Select label="Property type" name="type" defaultValue={defaults?.type ?? "APARTMENT"} required>
        {PROPERTY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </option>
        ))}
      </Select>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
