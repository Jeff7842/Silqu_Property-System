import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { listMpesaTransactions } from "@/server/db/queries/mpesa";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { CheckStatusButton } from "@/components/mpesa/check-status-button";

const STATUS_TONE = { INITIATED: "warning", COMPLETED: "success", FAILED: "danger", TIMEOUT: "danger" } as const;

export default async function ReconciliationPage() {
  const session = await auth();
  requireRole(session, ["MANAGER"]);
  const orgId = requireOrg(session);

  const transactions = await listMpesaTransactions(orgId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="M-Pesa reconciliation" description="Every STK push initiated for this organization." />

      <Card padded={false}>
        <DataTable
          rows={transactions}
          rowKey={(t) => t.id}
          emptyIcon="mpesa"
          emptyTitle="No M-Pesa transactions yet"
          columns={[
            { key: "purpose", header: "Purpose", render: (t) => t.purpose },
            { key: "phone", header: "Phone", render: (t) => t.phone },
            { key: "amount", header: "Amount", align: "right", render: (t) => <Money cents={t.amountCents} size="small" /> },
            { key: "status", header: "Status", render: (t) => <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge> },
            { key: "when", header: "Initiated", render: (t) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(t.createdAt) },
            { key: "action", header: "", align: "right", render: (t) => (t.status === "INITIATED" ? <CheckStatusButton transactionId={t.id} /> : null) },
          ]}
        />
      </Card>
    </div>
  );
}
