import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { listAllMpesaTransactions } from "@/server/db/queries/mpesa";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/empty-state";
import { ReplayButton } from "@/components/mpesa/replay-button";

const STATUS_TONE = { INITIATED: "warning", COMPLETED: "success", FAILED: "danger", TIMEOUT: "danger" } as const;

export default async function PlatformMpesaPage() {
  const session = await auth();
  requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);

  const transactions = await listAllMpesaTransactions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="M-Pesa webhooks" description="Every STK push across every organization, with the raw callback Safaricom sent." />

      {transactions.length === 0 ? (
        <Card><EmptyState icon="mpesa" title="No M-Pesa transactions yet" /></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {transactions.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{t.organization?.name ?? ":"} · {t.purpose}</p>
                  <p className="text-xs text-ink-muted">{t.phone} · {t.checkoutRequestId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Money cents={t.amountCents} size="small" />
                  <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                  {t.rawCallback && t.status !== "COMPLETED" && <ReplayButton transactionId={t.id} />}
                </div>
              </div>
              {t.rawCallback ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-primary">Raw callback</summary>
                  <pre className="mt-2 overflow-x-auto rounded-[--radius-control] bg-canvas p-3 text-xs text-ink-muted">
                    {JSON.stringify(t.rawCallback, null, 2)}
                  </pre>
                </details>
              ) : (
                <p className="mt-3 text-xs text-ink-muted">No callback received yet.</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
