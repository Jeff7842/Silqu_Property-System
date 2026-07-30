"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { logAudit } from "@/server/services/audit";
import { qstash } from "@/server/services/queue/client";

export type ActionState = { error?: string; success?: boolean } | undefined;

/** Re-delivers one dead-lettered job exactly as QStash originally would have. */
export async function replayDlqMessageAction(dlqId: string): Promise<ActionState> {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN"]);

  if (!qstash) return { error: "QStash isn't configured." };

  try {
    await qstash.dlq.retry(dlqId);
  } catch (err) {
    console.error("[jobs] DLQ retry failed:", err);
    return { error: "Couldn't replay this job. Check the QStash dashboard for details." };
  }

  logAudit({ actorUserId: user.id, action: "queue.job_replayed", entityType: "QStashMessage", entityId: dlqId });
  revalidatePath("/platform/jobs");
  return { success: true };
}
