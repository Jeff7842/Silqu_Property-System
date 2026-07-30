import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { computeArrears } from "@/server/services/billing/compute-arrears";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { fromCents } from "@/lib/money";
import { ExportCsvButton } from "@/components/billing/export-csv-button";
import { SendReminderButton } from "@/components/billing/send-reminder-button";

const BUCKET_TONE = { "0-30": "warning", "31-60": "warning", "61-90": "danger", "90+": "danger" } as const;

export default async function ArrearsReportPage() {
  const session = await auth();
  requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);

  const { rows, buckets, totalCents } = await computeArrears(orgId);
  const sorted = [...rows].sort((a, b) => b.daysOverdue - a.daysOverdue);

  const csvRows = sorted.map((r) => ({
    tenant: r.invoice.lease.tenant.fullName,
    property: r.invoice.lease.unit.property.name,
    unit: r.invoice.lease.unit.label,
    invoice: r.invoice.invoiceNo,
    daysOverdue: r.daysOverdue,
    balanceKES: fromCents(r.invoice.balanceCents),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Arrears"
        description="Outstanding balances, aged by days overdue."
        actions={<ExportCsvButton rows={csvRows} filename="arrears.csv" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {(["0-30", "31-60", "61-90", "90+"] as const).map((b) => (
          <div key={b} className="rounded-[--radius-card] border border-line bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{b} days</p>
            <Money cents={buckets[b]} size="metric" tone={buckets[b] > 0 ? "negative" : "default"} />
          </div>
        ))}
      </div>

      <p className="text-sm text-ink-muted">Total outstanding: <Money cents={totalCents} size="small" tone={totalCents > 0 ? "negative" : "default"} /></p>

      <Card padded={false}>
        <DataTable
          rows={sorted}
          rowKey={(r) => r.invoice.id}
          emptyIcon="success"
          emptyTitle="No arrears"
          emptyDescription="Every tenant is up to date."
          columns={[
            { key: "tenant", header: "Tenant", render: (r) => <span>{r.invoice.lease.tenant.fullName}</span> },
            { key: "unit", header: "Unit", render: (r) => <span className="text-ink-muted">{r.invoice.lease.unit.property.name} — {r.invoice.lease.unit.label}</span> },
            { key: "days", header: "Days overdue", render: (r) => <Badge tone={BUCKET_TONE[r.bucket]}>{r.daysOverdue} days</Badge> },
            { key: "balance", header: "Balance", align: "right", render: (r) => <Money cents={r.invoice.balanceCents} tone="negative" size="small" /> },
            { key: "reminder", header: "", align: "right", render: (r) => <SendReminderButton invoiceId={r.invoice.id} /> },
          ]}
        />
      </Card>
    </div>
  );
}
