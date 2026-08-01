"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { ModalTrigger } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { closeOverlay } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { toggleOrganizationStatusAction } from "@/server/actions/organization.actions";
import type { OrganizationStatus } from "@/generated/prisma/client";

export function ToggleOrgStatusButton({ orgId, status }: { orgId: string; status: OrganizationStatus }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { push } = useToast();

  if (status === "ARCHIVED") return null;

  const isSuspending = status === "ACTIVE";
  const id = `toggle-org-status-confirm-${orgId}`;

  return (
    <>
      <ModalTrigger targetId={id} className={buttonClass(isSuspending ? "danger" : "secondary", "sm")}>
        {isSuspending ? "Suspend" : "Reactivate"}
      </ModalTrigger>
      <ConfirmModal
        id={id}
        title={isSuspending ? "Suspend organization" : "Reactivate organization"}
        message={
          isSuspending
            ? "Suspend this organization? This is recorded in the audit log."
            : "Reactivate this organization?"
        }
        confirmLabel={isSuspending ? "Suspend" : "Reactivate"}
        danger={isSuspending}
        pending={isPending}
        onConfirm={() =>
          startTransition(async () => {
            await toggleOrganizationStatusAction(orgId);
            push(isSuspending ? "Organization suspended." : "Organization reactivated.", "success");
            closeOverlay(id);
            router.refresh();
          })
        }
      />
    </>
  );
}
