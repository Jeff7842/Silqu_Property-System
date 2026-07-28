import { auth } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { getTenantDashboardStats } from "@/server/db/queries/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";

const INVOICE_BADGE: Record<string, { tone: "success" | "danger" | "warning"; label: string }> = {
  PAID: { tone: "success", label: "Paid" },
  OPEN: { tone: "danger", label: "Unpaid" },
  PARTIALLY_PAID: { tone: "warning", label: "Partial" },
  VOID: { tone: "warning", label: "Void" },
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function TenantHome() {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);

  const stats = await getTenantDashboardStats(orgId, user.id);

  if (!stats) {
    return (
      <Card>
        <EmptyState
          icon="tenants"
          title="No tenant record found"
          description="Your account isn't linked to a tenant record yet. Contact your property manager."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome home, ${user.fullName.split(" ")[0]}`}
        description={stats.lease ? `${stats.lease.unit.label}, ${stats.lease.unit.property.name}` : "No active lease on file"}
      />

      {stats.nextDue && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-[--radius-card] border border-danger/30 bg-danger/5 p-5 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <Icon name="warning" size={22} className="mt-0.5 text-danger" />
            <div>
              <h2 className="text-sm font-semibold text-ink">Outstanding balance</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Rent for {MONTH_NAMES[stats.nextDue.periodMonth - 1]} {stats.nextDue.periodYear} is due.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Money cents={stats.balanceCents} tone="negative" size="metric" />
            <Button>Pay now</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Current balance"
          value={<Money cents={stats.balanceCents} tone={stats.balanceCents > 0 ? "negative" : "default"} size="metric" />}
          icon="payments"
          tone={stats.balanceCents > 0 ? "danger" : "success"}
        />
        <KpiCard label="Lease status" value={stats.lease?.status ?? "None"} icon="leases" />
        <KpiCard label="Total paid (this year)" value={<Money cents={stats.totalPaidThisYear} size="metric" />} icon="monitoring" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">Invoice history</h3>} padded={false}>
            <DataTable
              rows={stats.invoices}
              rowKey={(inv) => inv.id}
              emptyIcon="emptyMoney"
              emptyTitle="No invoices yet"
              columns={[
                {
                  key: "month",
                  header: "Month",
                  render: (inv) => `${MONTH_NAMES[inv.periodMonth - 1]} ${inv.periodYear}`,
                },
                { key: "amount", header: "Amount", render: (inv) => <Money cents={inv.totalCents} size="small" /> },
                {
                  key: "status",
                  header: "Status",
                  render: (inv) => {
                    const badge = INVOICE_BADGE[inv.status] ?? INVOICE_BADGE.OPEN;
                    return <Badge tone={badge.tone}>{badge.label}</Badge>;
                  },
                },
              ]}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card header={<h3 className="flex items-center gap-2 font-semibold text-ink"><Icon name="announcements" size={18} className="text-primary" />Announcements</h3>}>
            {stats.announcements.length === 0 ? (
              <p className="text-sm text-ink-muted">No announcements yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.announcements.map((a) => (
                  <div key={a.id} className="border-l-2 border-primary pl-4">
                    <p className="mb-1 text-xs text-ink-muted">
                      {a.publishedAt && new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(a.publishedAt)}
                    </p>
                    <p className="text-sm text-ink">{a.title}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card header={<h3 className="font-semibold text-ink">My requests</h3>}>
            {stats.openRequests === 0 ? (
              <EmptyState icon="success" title="All clear" description="No open maintenance requests." />
            ) : (
              <p className="text-sm text-ink">{stats.openRequests} open request{stats.openRequests === 1 ? "" : "s"}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
