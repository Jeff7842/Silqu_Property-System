"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { InitiatePaymentResult } from "@/server/services/mpesa/initiate-payment";

type Phase = "idle" | "initiating" | "polling" | "success" | "failed" | "still-processing" | "not-configured";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90_000;

export function StkPushPayment({
  onInitiate,
  fixedPhone,
  defaultPhone,
  payLabel = "Pay with M-Pesa",
  onSuccess,
  demoFallback,
}: {
  onInitiate: (phone: string) => Promise<InitiatePaymentResult>;
  /** 254XXXXXXXXX — when set, the phone is shown but not editable (e.g. signup, where it's the number just registered). */
  fixedPhone?: string;
  /** 9-digit prefill for the editable phone input. */
  defaultPhone?: string;
  payLabel?: string;
  onSuccess?: () => void;
  /** Rendered instead of the pay button when M-Pesa isn't configured — e.g. a demo/skip button in dev. */
  demoFallback?: React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [error, setError] = useState<string | null>(null);
  const pollStart = useRef(0);

  useEffect(() => {
    return () => {
      pollStart.current = POLL_TIMEOUT_MS + 1; // stop any in-flight poll loop on unmount
    };
  }, []);

  async function poll(checkoutId: string) {
    pollStart.current = Date.now();
    while (Date.now() - pollStart.current < POLL_TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const res = await fetch(`/api/stk-status/${checkoutId}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === "COMPLETED") {
        setPhase("success");
        onSuccess?.();
        return;
      }
      if (data.status === "FAILED" || data.status === "TIMEOUT") {
        setError(data.resultDesc || "Payment failed or was cancelled.");
        setPhase("failed");
        return;
      }
    }
    setPhase("still-processing");
  }

  async function start() {
    setError(null);
    setPhase("initiating");
    const activePhone = fixedPhone ?? `254${phone}`;
    const result = await onInitiate(activePhone);
    if ("error" in result) {
      if (demoFallback && result.error.includes("not configured")) {
        setPhase("not-configured");
        return;
      }
      setError(result.error);
      setPhase("failed");
      return;
    }
    setPhase("polling");
    poll(result.checkoutRequestId);
  }

  if (phase === "success") {
    return (
      <div className="flex items-center gap-2 rounded-[--radius-control] border border-success/30 bg-success/5 p-4 text-success">
        <Icon name="success" size={20} />
        <span className="text-sm font-medium">Payment confirmed.</span>
      </div>
    );
  }

  if (phase === "polling" || phase === "initiating") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[--radius-control] border border-line bg-canvas p-6 text-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-ink">Check your phone and enter your M-Pesa PIN.</p>
        <p className="text-xs text-ink-muted">Waiting for confirmation…</p>
      </div>
    );
  }

  if (phase === "still-processing") {
    return (
      <div className="flex flex-col gap-2 rounded-[--radius-control] border border-warning/30 bg-warning/5 p-4">
        <p className="text-sm text-ink">Still processing — this can take a moment. Check back shortly; it'll update itself once confirmed.</p>
      </div>
    );
  }

  if (phase === "not-configured" && demoFallback) {
    return <>{demoFallback}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      {!fixedPhone && (
        <Input label="M-Pesa phone" prefix="+254" placeholder="712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
      )}
      {fixedPhone && <p className="text-sm text-ink-muted">Paying from +254 {fixedPhone.slice(3)}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={start} disabled={!fixedPhone && !/^7\d{8}$/.test(phone)}>
        <Icon name="mpesa" size={18} />
        {payLabel}
      </Button>
    </div>
  );
}
