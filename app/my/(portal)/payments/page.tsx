import { auth } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { getTenantDashboardStats } from "@/server/db/queries/dashboard";
import { db } from "@/server/db/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/empty-state";
import { RentPayment } from "@/components/mpesa/rent-payment";

export default async function TenantPaymentsPage() {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);

  const stats = await getTenantDashboardStats(orgId, user.id);
  if (!stats?.lease) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payments" />
        <Card><EmptyState icon="payments" title="No active lease" description="You don't have an active lease to pay rent against." /></Card>
      </div>
    );
  }

  const tenant = await db.tenant.findFirst({ where: { orgId, userId: user.id }, select: { phone: true } });
  const defaultPhone = tenant?.phone.replace(/^254/, "");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payments" description="Pay your rent by M-Pesa." />

      <Card header={<h3 className="font-semibold text-ink">Outstanding balance</h3>} className="max-w-lg">
        <div className="mb-4">
          <Money cents={stats.balanceCents} size="metric" tone={stats.balanceCents > 0 ? "negative" : "default"} />
        </div>
        <RentPayment balanceCents={stats.balanceCents} defaultPhone={defaultPhone} />
      </Card>
    </div>
  );
}
