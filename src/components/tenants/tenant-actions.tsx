"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendInvitationAction, archiveTenantAction } from "@/server/actions/tenant.actions";

export function SendInviteButton({ tenantId }: { tenantId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await sendInvitationAction(tenantId);
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

  return (
    <Button
      variant="danger"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Archive this tenant?")) return;
        startTransition(async () => {
          await archiveTenantAction(tenantId);
          router.push("/app/tenants");
        });
      }}
    >
      Archive tenant
    </Button>
  );
}
