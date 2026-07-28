import { getFinanceDashboardStats } from "@/server/db/queries/dashboard";
import { getCachedKpis, setCachedKpis } from "@/server/services/redis/kpi-cache";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";

type FinanceStats = Awaited<ReturnType<typeof getFinanceDashboardStats>>;

async function loadStats(orgId: string): Promise<FinanceStats> {
  const cached = await getCachedKpis<FinanceStats>(orgId, "finance-dashboard");
  if (cached) return cached;
  const stats = await getFinanceDashboardStats(orgId);
  await setCachedKpis(orgId, "finance-dashboard", stats);
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

export async function FinanceDashboard({ orgId, fullName }: { orgId: string; fullName: string }) {
  const stats = await loadStats(orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome back, ${fullName.split(" ")[0]}`} description="Collections and arrears overview." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Collected today" value={<Money cents={stats.collectedTodayCents} size="metric" />} icon="mpesa" tone="success" />
        <KpiCard label="Collected (MTD)" value={<Money cents={stats.collectedMonthCents} size="metric" />} icon="payments" />
        <KpiCard label="Unpaid invoices" value={stats.unpaidInvoiceCount} icon="arrears" tone="danger" />
      </div>

      <Card header={<h3 className="font-semibold text-ink">Top arrears</h3>} padded={false}>
        <DataTable
          rows={stats.topArrears}
          rowKey={(inv) => inv.id}
          emptyIcon="emptyMoney"
          emptyTitle="No arrears"
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
              header: "Balance",
              align: "right",
              render: (inv) => <Money cents={inv.balanceCents} tone="negative" size="small" />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
