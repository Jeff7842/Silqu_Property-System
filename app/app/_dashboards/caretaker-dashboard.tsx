import Link from "next/link";
import { getCaretakerDashboardStats } from "@/server/db/queries/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_TONE = { VACANT: "neutral", OCCUPIED: "success", MAINTENANCE: "warning", RESERVED: "neutral" } as const;

export async function CaretakerDashboard({ orgId, userId, fullName }: { orgId: string; userId: string; fullName: string }) {
  const stats = await getCaretakerDashboardStats(orgId, userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome back, ${fullName.split(" ")[0]}`} description="Your assigned units and open requests." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="My units" value={stats.unitCount} icon="myUnits" />
        <KpiCard label="Occupancy" value={`${Math.round(stats.occupancyRate * 100)}%`} icon="occupancy" tone="success" />
        <KpiCard label="Open maintenance" value={stats.openMaintenance} icon="maintenance" tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">My units</h3>}>
            {stats.units.length === 0 ? (
              <EmptyState icon="emptyBuilding" title="No units assigned" description="Ask your manager to assign you to a property or unit." />
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {stats.units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/app/properties/${unit.propertyId}/units/${unit.id}`}
                    className="flex items-center justify-between py-3 hover:bg-canvas"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {unit.property.name} : {unit.label}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {unit.leases[0]?.tenant.fullName ?? "Vacant"}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[unit.status]}>{unit.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card header={<h3 className="font-semibold text-ink">Open requests</h3>}>
          {stats.requests.length === 0 ? (
            <p className="text-sm text-ink-muted">No open requests on your units.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.requests.map((req) => (
                <div key={req.id} className="rounded-[--radius-control] border border-line p-3">
                  <p className="text-sm font-medium text-ink">{req.category.replace("_", " ")}</p>
                  <p className="text-xs text-ink-muted">{req.unit.label}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
