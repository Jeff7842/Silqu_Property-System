import { db } from "@/server/db/client";

export function listPropertiesWithUnitsForCompose(orgId: string) {
  return db.property.findMany({
    where: { orgId },
    select: { id: true, name: true, units: { select: { id: true, label: true }, orderBy: { label: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export function listAnnouncements(orgId: string) {
  return db.announcement.findMany({
    where: { orgId },
    include: { property: true, unit: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });
}

/** userIds of tenants whose active lease matches this announcement's audience. */
export async function resolveAnnouncementRecipients(
  orgId: string,
  audience: { audience: "ALL" | "PROPERTY" | "UNIT"; propertyId?: string | null; unitId?: string | null },
) {
  const leases = await db.lease.findMany({
    where: {
      orgId,
      status: "ACTIVE",
      ...(audience.audience === "PROPERTY" && { unit: { propertyId: audience.propertyId! } }),
      ...(audience.audience === "UNIT" && { unitId: audience.unitId! }),
    },
    include: { tenant: true },
  });
  return leases.map((l) => l.tenant.userId).filter((id): id is string => !!id);
}
