"use client";

import { useEffect, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalTrigger } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { closeOverlay } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { activateLeaseAction, endLeaseAction, terminateLeaseAction, renewLeaseAction } from "@/server/actions/lease.actions";

export function LeaseActions({ leaseId, status }: { leaseId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { push } = useToast();
  const [renewState, renewFormAction, renewPending] = useActionState(renewLeaseAction.bind(null, leaseId), undefined);

  useEffect(() => {
    if (renewState?.success) {
      push("Lease renewed.", "success");
      router.refresh();
    }
  }, [renewState?.success, push, router]);

  function run(action: (id: string) => Promise<unknown>, message?: string, overlayId?: string) {
    startTransition(async () => {
      await action(leaseId);
      if (message) push(message, "success");
      if (overlayId) closeOverlay(overlayId);
      router.refresh();
    });
  }

  if (status === "ENDED" || status === "TERMINATED") return null;

  const endId = `end-lease-confirm-${leaseId}`;
  const terminateId = `terminate-lease-confirm-${leaseId}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "PENDING" && (
          <Button variant="secondary" disabled={isPending} onClick={() => run(activateLeaseAction, "Lease activated.")}>
            Activate now
          </Button>
        )}

        <ModalTrigger targetId={endId} className={buttonClass("secondary")}>
          End lease
        </ModalTrigger>
        <ConfirmModal
          id={endId}
          title="End lease"
          message="End this lease? The unit will become vacant."
          confirmLabel="End lease"
          pending={isPending}
          onConfirm={() => run(endLeaseAction, "Lease ended.", endId)}
        />

        <ModalTrigger targetId={terminateId} className={buttonClass("danger")}>
          Terminate
        </ModalTrigger>
        <ConfirmModal
          id={terminateId}
          title="Terminate lease"
          message="Terminate this lease? This can't be undone."
          confirmLabel="Terminate"
          danger
          pending={isPending}
          onConfirm={() => run(terminateLeaseAction, "Lease terminated.", terminateId)}
        />
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
