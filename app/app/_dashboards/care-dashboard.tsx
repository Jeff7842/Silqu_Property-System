import { getCareDashboardStats } from "@/server/db/queries/dashboard";
import { getCachedKpis, setCachedKpis } from "@/server/services/redis/kpi-cache";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type CareStats = Awaited<ReturnType<typeof getCareDashboardStats>>;

async function loadStats(orgId: string): Promise<CareStats> {
  const cached = await getCachedKpis<CareStats>(orgId, "care-dashboard");
  if (cached) return cached;
  const stats = await getCareDashboardStats(orgId);
  await setCachedKpis(orgId, "care-dashboard", stats);
  return stats;
}

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger", URGENT: "danger" } as const;

export async function CareDashboard({ orgId, fullName }: { orgId: string; fullName: string }) {
  const stats = await loadStats(orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome back, ${fullName.split(" ")[0]}`} description="Tenant requests and onboarding at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label="Open maintenance requests" value={stats.openMaintenance} icon="maintenance" tone="warning" />
        <KpiCard label="New tenants this month" value={stats.newTenants} icon="tenants" tone="success" />
      </div>

      <Card header={<h3 className="font-semibold text-ink">Open requests</h3>}>
        {stats.requests.length === 0 ? (
          <EmptyState icon="emptyInbox" title="No open requests" description="All maintenance requests are resolved." />
        ) : (
          <div className="flex flex-col gap-3">
            {stats.requests.map((req) => (
              <div key={req.id} className="rounded-[--radius-control] border border-line p-3">
                <div className="mb-1 flex items-start justify-between">
                  <span className="text-sm font-medium text-ink">{req.category.replace("_", " ")}</span>
                  <span className="text-xs text-ink-muted">
                    {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(req.createdAt)}
                  </span>
                </div>
                <p className="mb-2 text-xs text-ink-muted">
                  {req.unit.property.name} : {req.unit.label}
                  {req.tenant ? ` · ${req.tenant.fullName}` : ""}
                </p>
                <Badge tone={PRIORITY_TONE[req.priority]}>{req.priority}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
