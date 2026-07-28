import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { getPlatformDashboardStats } from "@/server/db/queries/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";

export default async function PlatformHome() {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);
  const stats = await getPlatformDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome back, ${user.fullName.split(" ")[0]}`} description="Platform-wide health at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Organizations" value={stats.orgCount} icon="organizations" />
        <KpiCard label="Active subscriptions" value={stats.activeSubscriptions} icon="subscription" tone="success" />
        <KpiCard label="MRR" value={<Money cents={stats.mrrCents} size="metric" />} icon="payments" />
        <KpiCard label="New orgs this month" value={stats.newOrgsThisMonth} icon="organizations" tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card header={<h3 className="font-semibold text-ink">Background jobs</h3>}>
          <p className="text-sm text-ink-muted">
            {stats.failedJobs} failed job{stats.failedJobs === 1 ? "" : "s"} in the last 24 hours.
          </p>
          <p className="mt-1 text-xs text-ink-muted">QStash job monitoring goes live in Phase 7.</p>
        </Card>
        <Card header={<h3 className="font-semibold text-ink">M-Pesa health</h3>}>
          <p className="text-sm text-ink-muted">{stats.mpesaFailureRate24h}% failure rate in the last 24 hours.</p>
          <p className="mt-1 text-xs text-ink-muted">Live Daraja traffic starts in Phase 8.</p>
        </Card>
      </div>
    </div>
  );
}
