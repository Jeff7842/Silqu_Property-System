import Link from "next/link";
import { notFound, forbidden } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { getPropertyById, listCaretakers } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoUpload } from "@/components/properties/photo-upload";
import { CaretakerAssignForm } from "@/components/properties/caretaker-assign-form";
import { ArchivePropertyButton } from "@/components/properties/archive-property-button";

const UNIT_STATUS_TONE = { VACANT: "neutral", OCCUPIED: "success", MAINTENANCE: "warning", RESERVED: "neutral" } as const;

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);
  const { id } = await params;

  const property = await getPropertyById(orgId, id);
  if (!property) notFound();

  if (user.role === "CARETAKER" && !property.caretakerAssignments.some((a) => a.userId === user.id)) {
    forbidden();
  }

  const canManage = hasAccess(user, "createEditProperty");
  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
  const total = property.units.length;
  const rate = total ? Math.round((occupied / total) * 100) : 0;
  const caretakers = canManage ? await listCaretakers(orgId) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={property.name}
        description={`${property.address}, ${property.town}, ${property.county}`}
        actions={
          canManage && (
            <>
              <Link href={`/app/properties/${id}/edit`}><Button variant="secondary">Edit</Button></Link>
              <Link href={`/app/properties/${id}/units/new`}><Button>Add units</Button></Link>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">Occupancy</h3>}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">{occupied}/{total} units occupied</span>
              <span className="font-semibold text-ink">{rate}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
            </div>
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Units</h3>} padded={false}>
            {property.units.length === 0 ? (
              <div className="p-5">
                <EmptyState icon="units" title="No units yet" description={canManage ? "Add units to start leasing this property." : undefined} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
                {property.units.map((u) => (
                  <Link
                    key={u.id}
                    href={`/app/properties/${id}/units/${u.id}`}
                    className="flex flex-col gap-1 bg-surface p-4 hover:bg-canvas"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{u.label}</span>
                      <Badge tone={UNIT_STATUS_TONE[u.status]}>{u.status}</Badge>
                    </div>
                    <span className="text-xs text-ink-muted">{u.unitType}</span>
                    <Money cents={u.rentCents} size="small" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card header={<h3 className="font-semibold text-ink">Photo</h3>}>
            {canManage ? (
              <PhotoUpload propertyId={id} photoUrl={property.photoUrl} />
            ) : property.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={property.photoUrl} alt={property.name} className="h-40 w-full rounded-[--radius-card] object-cover" />
            ) : (
              <p className="text-sm text-ink-muted">No photo uploaded.</p>
            )}
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Caretakers</h3>}>
            {canManage ? (
              <CaretakerAssignForm
                propertyId={id}
                caretakers={caretakers}
                units={property.units}
                assignments={property.caretakerAssignments}
              />
            ) : property.caretakerAssignments.length === 0 ? (
              <p className="text-sm text-ink-muted">No caretakers assigned.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {property.caretakerAssignments.map((a) => (
                  <li key={a.id}>{a.user.fullName}</li>
                ))}
              </ul>
            )}
          </Card>

          {canManage && property.status === "ACTIVE" && (
            <Card>
              <ArchivePropertyButton propertyId={id} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
