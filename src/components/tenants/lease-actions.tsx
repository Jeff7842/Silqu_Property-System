"use client";

import { useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activateLeaseAction, endLeaseAction, terminateLeaseAction, renewLeaseAction } from "@/server/actions/lease.actions";

export function LeaseActions({ leaseId, status }: { leaseId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [renewState, renewFormAction, renewPending] = useActionState(renewLeaseAction.bind(null, leaseId), undefined);

  function run(action: (id: string) => Promise<unknown>) {
    startTransition(async () => {
      await action(leaseId);
      router.refresh();
    });
  }

  if (status === "ENDED" || status === "TERMINATED") return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "PENDING" && (
          <Button variant="secondary" disabled={isPending} onClick={() => run(activateLeaseAction)}>
            Activate now
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            if (confirm("End this lease? The unit will become vacant.")) run(endLeaseAction);
          }}
        >
          End lease
        </Button>
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() => {
            if (confirm("Terminate this lease? This can't be undone.")) run(terminateLeaseAction);
          }}
        >
          Terminate
        </Button>
      </div>
      {status === "ACTIVE" && (
        <form action={renewFormAction} className="flex items-end gap-2">
          <Input label="Renew until" name="endDate" type="date" required />
          <Button type="submit" variant="secondary" loading={renewPending}>Renew</Button>
        </form>
      )}
      {renewState?.error && <p className="text-sm text-danger">{renewState.error}</p>}
    </div>
  );
}
