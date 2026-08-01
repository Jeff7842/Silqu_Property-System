"use client";

import { useActionState, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeKenyaPhone } from "@/lib/phone";
import type { ActionState } from "@/server/actions/tenant.actions";

export function TenantForm({
  action,
  onSuccess,
  defaults,
  submitLabel = "Save tenant",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onSuccess?: () => void;
  defaults?: { fullName: string; nationalId: string; phone: string; email: string | null; nextOfKinName: string | null; nextOfKinPhone: string | null };
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) onSuccess?.();
  }, [state?.success, onSuccess]);

  const [phone, setPhone] = useState(defaults?.phone.replace(/^254/, "") ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="Full name" name="fullName" defaultValue={defaults?.fullName} placeholder="Jane Wanjiku" required />
      <Input label="National ID / passport" name="nationalId" defaultValue={defaults?.nationalId} placeholder="12345678" required />
      <Input
        label="Phone"
        name="phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => setPhone((v) => normalizeKenyaPhone(v) ?? v)}
        prefix="+254"
        placeholder="712345678"
        required
      />
      <Input label="Email" name="email" type="email" defaultValue={defaults?.email ?? ""} placeholder="jane@example.com" required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Next of kin name" name="nextOfKinName" defaultValue={defaults?.nextOfKinName ?? ""} />
        <Input label="Next of kin phone" name="nextOfKinPhone" defaultValue={defaults?.nextOfKinPhone ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
