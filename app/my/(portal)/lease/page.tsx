import { auth } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { getActiveLeaseForTenantUser } from "@/server/db/queries/leases";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/empty-state";

// Matches the tone convention used for lease status elsewhere (see
// app/app/tenants/[id]/page.tsx) so a status reads the same across portals.
const LEASE_TONE = { PENDING: "warning", ACTIVE: "success", ENDED: "neutral", TERMINATED: "danger" } as const;

const dateFormatter = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" });

export default async function TenantLeasePage() {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);

  const lease = await getActiveLeaseForTenantUser(orgId, user.id);

  if (!lease) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Lease agreement" />
        <Card>
          <EmptyState
            icon="leases"
            title="No active lease"
            description="You don't have an active lease on file yet. Contact your property manager if you believe this is a mistake."
          />
        </Card>
      </div>
    );
  }

  const { unit } = lease;
  const { property } = unit;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Lease agreement" description={`${property.name} — ${unit.label}`} />

      <Card
        header={
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">Lease details</h3>
            <Badge tone={LEASE_TONE[lease.status]}>{lease.status}</Badge>
          </div>
        }
      >
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Unit</dt>
            <dd className="text-ink">{unit.label}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Property</dt>
            <dd className="text-ink">{property.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">Address</dt>
            <dd className="text-right text-ink">
              {property.address}, {property.town}, {property.county}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Lease start</dt>
            <dd className="text-ink">{dateFormatter.format(lease.startDate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Lease end</dt>
            <dd className="text-ink">{dateFormatter.format(lease.endDate)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[--radius-card] border border-line bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Monthly rent</p>
          <Money cents={lease.rentCents} size="metric" />
        </div>
        <div className="rounded-[--radius-card] border border-line bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Deposit</p>
          <Money cents={lease.depositCents} size="metric" />
        </div>
      </div>
    </div>
  );
}
