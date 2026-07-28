import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { getInvoiceById } from "@/server/db/queries/invoices";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { Button } from "@/components/ui/button";

const INVOICE_TONE = { OPEN: "danger", PARTIALLY_PAID: "warning", PAID: "success", VOID: "neutral" } as const;

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);
  const { id } = await params;

  const invoice = await getInvoiceById(orgId, id);
  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice.invoiceNo}
        description={`${invoice.lease.tenant.fullName} — ${invoice.lease.unit.property.name} ${invoice.lease.unit.label}`}
        actions={<Link href={`/app/tenants/${invoice.lease.tenantId}`}><Button variant="secondary">Record payment</Button></Link>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">Lines</h3>} padded={false}>
            <div className="flex flex-col divide-y divide-line">
              {invoice.lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="text-ink">{l.description}</p>
                    <p className="text-xs text-ink-muted">{l.category}</p>
                  </div>
                  <Money cents={l.amountCents} size="small" />
                </div>
              ))}
            </div>
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Payments applied</h3>}>
            {invoice.allocations.length === 0 ? (
              <p className="text-sm text-ink-muted">No payments applied yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {invoice.allocations.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink-muted">{a.payment.method.replace("_", " ")} · {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(a.payment.paidAt)}</span>
                    <Money cents={a.amountCents} tone="positive" size="small" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card header={<h3 className="font-semibold text-ink">Summary</h3>}>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-muted">Period</dt><dd className="text-ink">{invoice.periodMonth}/{invoice.periodYear}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Due</dt><dd className="text-ink">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(invoice.dueDate)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Total</dt><dd><Money cents={invoice.totalCents} size="small" /></dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Paid</dt><dd><Money cents={invoice.paidCents} size="small" tone="positive" /></dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Balance</dt><dd><Money cents={invoice.balanceCents} size="small" tone={invoice.balanceCents > 0 ? "negative" : "default"} /></dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Status</dt><dd><Badge tone={INVOICE_TONE[invoice.status]}>{invoice.status.replace("_", " ")}</Badge></dd></div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
