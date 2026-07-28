"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StkPushPayment } from "@/components/mpesa/stk-push-payment";
import { initiateSubscriptionPaymentAction, activateSubscriptionDemoAction } from "@/server/actions/mpesa.actions";

export function SubscriptionPayment() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <StkPushPayment
      onInitiate={initiateSubscriptionPaymentAction}
      onSuccess={() => router.refresh()}
      demoFallback={
        <Button
          loading={isPending}
          onClick={() => startTransition(async () => {
            await activateSubscriptionDemoAction();
            router.refresh();
          })}
        >
          Activate (Demo)
        </Button>
      }
    />
  );
}
