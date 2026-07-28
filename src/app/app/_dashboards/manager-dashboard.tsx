import { getManagerDashboardStats } from "@/server/db/queries/dashboard";
import { getCachedKpis, setCachedKpis } from "@/server/services/redis/kpi-cache";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { Icon } from "@/components/ui/icon";

type ManagerStats = Awaited<ReturnType<typeof getManagerDashboardStats>>;

async function loadStats(orgId: string): Promise<ManagerStats> {
  const cached = await getCachedKpis<ManagerStats>(orgId, "manager-dashboard");
  if (cached) return cached;
  const stats = await getManagerDashboardStats(orgId);
  await setCachedKpis(orgId, "manager-dashboard", stats);
  return stats;
}

function daysOverdue(dueDate: Date) {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86_400_000));
}

function overdueTone(days: number): "danger" | "warning" | "neutral" {
  if (days >= 30) return "danger";
  if (days >= 14) return "warning";
  return "neutral";
}

export async function ManagerDashboard({ orgId, fullName }: { orgId: string; fullName: string }) {
  const stats = await loadStats(orgId);
  const collectedRate = stats.expectedCents ? Math.round((stats.collectedCents / stats.expectedCents) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome back, ${fullName.split(" ")[0]}`} description="Here's how your portfolio is doing this month." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total units" value={stats.totalUnits} icon="properties" />
        <KpiCard
          label="Occupancy"
          value={`${Math.round(stats.occupancyRate * 100)}%`}
          icon="occupancy"
          tone="success"
          trend={`${stats.occupiedUnits} of ${stats.totalUnits} occupied`}
        />
        <KpiCard
          label="Collected (MTD)"
          value={<Money cents={stats.collectedCents} size="metric" />}
          icon="payments"
          trend={`${collectedRate}% of expected`}
        />
        <KpiCard
          label="Total arrears"
          value={<Money cents={stats.arrearsCents} size="metric" tone="negative" />}
          icon="arrears"
          tone="danger"
          trend={`Across ${stats.arrearsTenantCount} invoice${stats.arrearsTenantCount === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">Unpaid balances</h3>} padded={false}>
            <DataTable
              rows={stats.unpaidInvoices}
              rowKey={(inv) => inv.id}
              emptyIcon="emptyMoney"
              emptyTitle="No unpaid balances"
              emptyDescription="Every tenant is up to date."
              columns={[
                {
                  key: "tenant",
                  header: "Tenant / Unit",
                  render: (inv) => (
                    <div>
                      <div className="font-medium text-ink">{inv.lease.tenant.fullName}</div>
                      <div className="text-xs text-ink-muted">{inv.lease.unit.label}</div>
                    </div>
                  ),
                },
                {
                  key: "property",
                  header: "Property",
                  render: (inv) => <span className="text-ink-muted">{inv.lease.unit.property.name}</span>,
                },
                {
                  key: "overdue",
                  header: "Days overdue",
                  render: (inv) => {
                    const days = daysOverdue(inv.dueDate);
                    return <Badge tone={overdueTone(days)}>{days} days</Badge>;
                  },
                },
                {
                  key: "amount",
                  header: "Amount",
                  align: "right",
                  render: (inv) => <Money cents={inv.balanceCents} tone="negative" size="small" />,
                },
              ]}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card header={<h3 className="font-semibold text-ink">Recent payments</h3>}>
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-ink-muted">No payments recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name="mpesa" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{payment.tenant.fullName}</p>
                        <p className="text-xs text-ink-muted">{payment.method.replace("_", " ")}</p>
                      </div>
                    </div>
                    <Money cents={payment.amountCents} tone="positive" size="small" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card header={<h3 className="font-semibold text-ink">Occupancy by property</h3>}>
        {stats.occupancyByProperty.length === 0 ? (
          <p className="text-sm text-ink-muted">No active properties yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.occupancyByProperty.map((p) => {
              const rate = p.total ? Math.round((p.occupied / p.total) * 100) : 0;
              return (
                <div key={p.id} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="text-ink-muted">{rate}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                  </div>
                  <div className="text-right text-xs text-ink-muted">
                    {p.occupied}/{p.total} units
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
