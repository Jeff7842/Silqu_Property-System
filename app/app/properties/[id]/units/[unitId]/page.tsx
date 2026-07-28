import { notFound, forbidden } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { can } from "@/server/auth/permissions";
import { getUnitDetailById, isUnitAssignedToCaretaker } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/empty-state";
import { UnitStatusForm } from "@/components/properties/unit-status-form";

const STATUS_TONE = { VACANT: "neutral", OCCUPIED: "success", MAINTENANCE: "warning", RESERVED: "neutral" } as const;
const LEASE_TONE = { PENDING: "warning", ACTIVE: "success", ENDED: "neutral", TERMINATED: "danger" } as const;

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);
  const { id, unitId } = await params;

  const unit = await getUnitDetailById(orgId, unitId);
  if (!unit || unit.propertyId !== id) notFound();

  if (user.role === "CARETAKER" && !(await isUnitAssignedToCaretaker(user.id, unitId, unit.propertyId))) {
    forbidden();
  }

  const statusAccess = can(user, "updateUnitStatus");
  const activeLease = unit.leases.find((l) => l.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`${unit.property.name} — ${unit.label}`} description={unit.unitType} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">Current lease</h3>}>
            {activeLease ? (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{activeLease.tenant.fullName}</span>
                  <Badge tone={LEASE_TONE[activeLease.status]}>{activeLease.status}</Badge>
                </div>
                <p className="text-ink-muted">
                  {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(activeLease.startDate)} –{" "}
                  {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(activeLease.endDate)}
                </p>
                <Money cents={activeLease.rentCents} size="small" />
              </div>
            ) : (
              <EmptyState icon="leases" title="No active lease" description="This unit is currently vacant." />
            )}
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Recent payments</h3>}>
            {activeLease?.payments.length ? (
              <div className="flex flex-col divide-y divide-line">
                {activeLease.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink-muted">{p.method.replace("_", " ")}</span>
                    <Money cents={p.amountCents} tone="positive" size="small" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No payments recorded yet.</p>
            )}
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Maintenance history</h3>}>
            {unit.maintenanceRequests.length === 0 ? (
              <p className="text-sm text-ink-muted">No maintenance requests on this unit.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {unit.maintenanceRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-ink">{r.category.replace("_", " ")}</p>
                      <p className="text-xs text-ink-muted">{r.tenant?.fullName ?? "—"}</p>
                    </div>
                    <Badge tone="neutral">{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card header={<h3 className="font-semibold text-ink">Details</h3>}>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Bedrooms</dt><dd className="text-ink">{unit.bedrooms}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Rent</dt><dd><Money cents={unit.rentCents} size="small" /></dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Deposit</dt><dd><Money cents={unit.depositCents} size="small" /></dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Status</dt><dd><Badge tone={STATUS_TONE[unit.status]}>{unit.status}</Badge></dd></div>
            </dl>
          </Card>

          {statusAccess !== "none" && (
            <Card header={<h3 className="font-semibold text-ink">Change status</h3>}>
              <UnitStatusForm unitId={unit.id} currentStatus={unit.status} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
