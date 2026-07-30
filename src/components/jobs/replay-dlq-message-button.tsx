"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { replayDlqMessageAction } from "@/server/actions/queue.actions";

export function ReplayDlqMessageButton({ dlqId }: { dlqId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          await replayDlqMessageAction(dlqId);
          router.refresh();
        })
      }
    >
      Replay
    </Button>
  );
}
