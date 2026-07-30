"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleOrganizationStatusAction } from "@/server/actions/organization.actions";
import type { OrganizationStatus } from "@/generated/prisma/client";

export function ToggleOrgStatusButton({ orgId, status }: { orgId: string; status: OrganizationStatus }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (status === "ARCHIVED") return null;

  const isSuspending = status === "ACTIVE";

  return (
    <Button
      variant={isSuspending ? "danger" : "secondary"}
      size="sm"
      disabled={isPending}
      onClick={() => {
        const message = isSuspending
          ? "Suspend this organization? This is recorded in the audit log."
          : "Reactivate this organization?";
        if (!confirm(message)) return;
        startTransition(async () => {
          await toggleOrganizationStatusAction(orgId);
          router.refresh();
        });
      }}
    >
      {isSuspending ? "Suspend" : "Reactivate"}
    </Button>
  );
}
