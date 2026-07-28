import { acquireLock, releaseLock } from "@/server/services/redis/lock";
import { generateInvoicesForPeriod } from "@/server/services/billing/generate-invoices";

/** Shared by the manager's manual "generate now" button and the monthly QStash cron job — same lock, same idempotent generator, whichever fires first wins. */
export async function runInvoiceGenerationForOrg(orgId: string, year: number, month: number) {
  const lockKey = `lock:invoices:${orgId}:${year}-${String(month).padStart(2, "0")}`;
  const acquired = await acquireLock(lockKey, 300);
  if (!acquired) {
    return { status: "in_progress" as const };
  }

  try {
    const result = await generateInvoicesForPeriod(orgId, year, month);
    return { status: "done" as const, created: result.created };
  } finally {
    await releaseLock(lockKey);
  }
}
