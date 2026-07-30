"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateMaintenanceStatusAction } from "@/server/actions/maintenance.actions";
import type { MaintenanceStatus } from "@/generated/prisma/client";

const LABELS: Record<MaintenanceStatus, string> = {
  OPEN: "Reopen",
  ASSIGNED: "Mark assigned",
  IN_PROGRESS: "Start work",
  RESOLVED: "Mark resolved",
  CLOSED: "Close",
};

export function StatusActions({ requestId, options }: { requestId: string; options: MaintenanceStatus[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((status) => (
        <Button
          key={status}
          variant={status === "CLOSED" ? "danger" : "secondary"}
          disabled={isPending}
          onClick={() => startTransition(async () => {
            await updateMaintenanceStatusAction(requestId, status);
            router.refresh();
          })}
        >
          {LABELS[status]}
        </Button>
      ))}
    </div>
  );
}
