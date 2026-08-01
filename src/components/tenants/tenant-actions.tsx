"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/button";
import { ModalTrigger } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { closeOverlay } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { sendInvitationAction, archiveTenantAction } from "@/server/actions/tenant.actions";

export function SendInviteButton({ tenantId }: { tenantId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { push } = useToast();

  return (
    <Button
      variant="secondary"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await sendInvitationAction(tenantId);
        push("Invitation sent.", "success");
        router.refresh();
      })}
    >
      Send invite
    </Button>
  );
}

export function ArchiveTenantButton({ tenantId }: { tenantId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { push } = useToast();
  const id = `archive-tenant-confirm-${tenantId}`;

  return (
    <>
      <ModalTrigger targetId={id} className={buttonClass("danger")}>
        Archive tenant
      </ModalTrigger>
      <ConfirmModal
        id={id}
        title="Archive tenant"
        message="Archive this tenant? They will be hidden from active listings."
        confirmLabel="Archive tenant"
        danger
        pending={isPending}
        onConfirm={() =>
          startTransition(async () => {
            await archiveTenantAction(tenantId);
            push("Tenant archived.", "success");
            closeOverlay(id);
            router.push("/app/tenants");
          })
        }
      />
    </>
  );
}
