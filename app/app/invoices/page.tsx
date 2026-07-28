import Link from "next/link";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { listInvoices } from "@/server/db/queries/invoices";
import { listProperties } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GenerateInvoicesForm } from "@/components/billing/generate-invoices-form";

const INVOICE_TONE = { OPEN: "danger", PARTIALLY_PAID: "warning", PAID: "success", VOID: "neutral" } as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; propertyId?: string }>;
}) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);
  const { status, propertyId } = await searchParams;

  const canGenerate = hasAccess(user, "generateInvoices");
  const [{ invoices, totals }, properties] = await Promise.all([
    listInvoices(orgId, {
      status: status === "OPEN" || status === "PARTIALLY_PAID" || status === "PAID" || status === "VOID" ? status : undefined,
      propertyId: propertyId || undefined,
    }),
    listProperties(orgId, { status: "ACTIVE" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Financials" description="Invoices, collections and arrears." />

      {canGenerate && (
        <Card header={<h3 className="font-semibold text-ink">Generate invoices</h3>}>
          <GenerateInvoicesForm />
        </Card>
      )}

      <form className="flex flex-wrap items-end gap-3" method="get">
        <Select name="propertyId" label="Property" defaultValue={propertyId ?? ""} className="w-56">
          <option value="">All properties</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select name="status" label="Status" defaultValue={status ?? ""} className="w-40">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="PARTIALLY_PAID">Partially paid</option>
          <option value="PAID">Paid</option>
          <option value="VOID">Void</option>
        </Select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[--radius-card] border border-line bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Invoices</p>
          <p className="mt-1 text-xl font-semibold text-ink">{totals.count}</p>
        </div>
        <div className="rounded-[--radius-card] border border-line bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Total</p>
          <Money cents={totals.totalCents} size="metric" />
        </div>
        <div className="rounded-[--radius-card] border border-line bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Outstanding</p>
          <Money cents={totals.balanceCents} tone={totals.balanceCents > 0 ? "negative" : "default"} size="metric" />
        </div>
      </div>

      <Card padded={false}>
        <DataTable
          rows={invoices}
          rowKey={(inv) => inv.id}
          emptyIcon="emptyMoney"
          emptyTitle="No invoices yet"
          columns={[
            { key: "no", header: "Invoice", render: (inv) => <Link href={`/app/invoices/${inv.id}`} className="font-medium text-primary hover:underline">{inv.invoiceNo}</Link> },
            { key: "tenant", header: "Tenant", render: (inv) => <span>{inv.lease.tenant.fullName}</span> },
            { key: "unit", header: "Unit", render: (inv) => <span className="text-ink-muted">{inv.lease.unit.property.name} — {inv.lease.unit.label}</span> },
            { key: "period", header: "Period", render: (inv) => `${MONTHS[inv.periodMonth - 1]} ${inv.periodYear}` },
            { key: "status", header: "Status", render: (inv) => <Badge tone={INVOICE_TONE[inv.status]}>{inv.status.replace("_", " ")}</Badge> },
            { key: "balance", header: "Balance", align: "right", render: (inv) => <Money cents={inv.balanceCents} tone={inv.balanceCents > 0 ? "negative" : "default"} size="small" /> },
          ]}
        />
      </Card>
    </div>
  );
}
