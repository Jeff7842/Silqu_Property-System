"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { checkMpesaStatusAction } from "@/server/actions/mpesa-admin.actions";

export function CheckStatusButton({ transactionId }: { transactionId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      loading={isPending}
      onClick={() => startTransition(async () => {
        await checkMpesaStatusAction(transactionId);
        router.refresh();
      })}
    >
      Check now
    </Button>
  );
}
