"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { fromCents } from "@/lib/money";
import { StkPushPayment } from "@/components/mpesa/stk-push-payment";
import { initiateRentPaymentAction } from "@/server/actions/mpesa.actions";

export function RentPayment({ balanceCents, defaultPhone }: { balanceCents: number; defaultPhone?: string }) {
  const router = useRouter();
  const [amountKES, setAmountKES] = useState(String(fromCents(Math.max(balanceCents, 0))));

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Amount (KES)"
        type="number"
        min={1}
        step="0.01"
        value={amountKES}
        onChange={(e) => setAmountKES(e.target.value)}
      />
      <StkPushPayment
        defaultPhone={defaultPhone}
        payLabel="Pay rent"
        onInitiate={(phone) => initiateRentPaymentAction(phone, Number(amountKES))}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
