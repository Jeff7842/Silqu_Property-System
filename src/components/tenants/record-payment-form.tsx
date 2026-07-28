"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { recordPaymentAction } from "@/server/actions/billing.actions";

export function RecordPaymentForm({ tenantId, leaseId }: { tenantId: string; leaseId: string }) {
  const [state, formAction, pending] = useActionState(recordPaymentAction.bind(null, tenantId), undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="leaseId" value={leaseId} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount (KES)" name="amountKES" type="number" min={1} step="0.01" required />
        <Select label="Method" name="method" required>
          <option value="MPESA">M-Pesa</option>
          <option value="BANK">Bank</option>
          <option value="CASH">Cash</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Reference" name="reference" placeholder="M-Pesa code, etc." />
        <Input label="Date" name="paidAt" type="date" defaultValue={today} required />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="self-start">Record payment</Button>
    </form>
  );
}
