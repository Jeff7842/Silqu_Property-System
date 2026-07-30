import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { qstash } from "@/server/services/queue/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReplayDlqMessageButton } from "@/components/jobs/replay-dlq-message-button";

export default async function JobsPage() {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);

  if (!qstash) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Jobs & queues" description="QStash schedules, deliveries and dead-letter queue." />
        <Card>
          <EmptyState
            icon="jobs"
            title="QStash isn't configured"
            description="Set QSTASH_TOKEN and QSTASH_TARGET_BASE_URL to see live schedules and failures here."
          />
        </Card>
      </div>
    );
  }

  // Narrowed to a local before use — `qstash` is typed as possibly
  // undefined (it's a module export), and the `if (!qstash) return` above
  // doesn't narrow it inside the object/array literals below.
  const client = qstash;

  const [dlq, schedules] = await Promise.all([
    client.dlq.listMessages({ count: 100 }).catch(() => ({ messages: [] as Awaited<ReturnType<typeof client.dlq.listMessages>>["messages"] })),
    client.schedules.list().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Jobs & queues" description="QStash schedules, deliveries and dead-letter queue." />

      <Card header={<h3 className="font-semibold text-ink">Schedules</h3>} padded={false}>
        {schedules.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="jobs" title="No schedules configured" />
          </div>
        ) : (
          <div className="divide-y divide-line">
            {schedules.map((s) => (
              <div key={s.scheduleId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-mono text-xs text-ink">{s.destination}</p>
                  <p className="text-xs text-ink-muted">{s.cron}</p>
                </div>
                <Badge tone={s.isPaused ? "warning" : "success"}>{s.isPaused ? "Paused" : "Active"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card header={<h3 className="font-semibold text-ink">Dead-letter queue</h3>} padded={false}>
        {dlq.messages.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="success" title="No failed deliveries" description="Everything in the DLQ has been cleared." />
          </div>
        ) : (
          <div className="divide-y divide-line">
            {dlq.messages.map((m) => (
              <div key={m.dlqId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-mono text-xs text-ink">{m.url}</p>
                  <p className="text-xs text-ink-muted">
                    Status {m.responseStatus ?? "—"} · {new Date(m.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
                  </p>
                </div>
                {user.role === "PLATFORM_ADMIN" && <ReplayDlqMessageButton dlqId={m.dlqId} />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
