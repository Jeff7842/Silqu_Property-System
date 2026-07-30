import Link from "next/link";
import { auth } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { listMaintenanceForTenant } from "@/server/db/queries/maintenance";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RaiseRequestForm } from "@/components/maintenance/raise-request-form";

const STATUS_TONE = { OPEN: "danger", ASSIGNED: "warning", IN_PROGRESS: "warning", RESOLVED: "success", CLOSED: "neutral" } as const;

export default async function TenantMaintenancePage() {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);

  const tenant = await db.tenant.findFirst({ where: { orgId, userId: user.id } });
  const requests = tenant ? await listMaintenanceForTenant(orgId, tenant.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Maintenance" description="Raise an issue and track its progress." />

      <Card header={<h3 className="font-semibold text-ink">Raise a request</h3>} className="max-w-lg">
        <RaiseRequestForm />
      </Card>

      <Card header={<h3 className="font-semibold text-ink">My requests</h3>}>
        {requests.length === 0 ? (
          <EmptyState icon="maintenance" title="No requests yet" />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {requests.map((r) => (
              <Link key={r.id} href={`/my/maintenance/${r.id}`} className="flex items-center justify-between py-3 hover:bg-canvas">
                <div>
                  <p className="text-sm font-medium text-ink">{r.category.replace("_", " ")}</p>
                  <p className="text-xs text-ink-muted">{r.unit.property.name} — {r.unit.label} · {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(r.createdAt)}</p>
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{r.status.replace("_", " ")}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
