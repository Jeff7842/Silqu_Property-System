"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sendArrearsReminderAction } from "@/server/actions/billing.actions";

/** Per-row "send reminder" action on the arrears report : mirrors the
 *  pattern in ReplayButton: a small client island calling a server action
 *  and surfacing the result as a toast (rule 18). */
export function SendReminderButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await sendArrearsReminderAction(invoiceId);
          if (result?.error) {
            push(result.error, "danger");
          } else {
            push("Reminder sent.", "success");
          }
        })
      }
    >
      Send reminder
    </Button>
  );
}
