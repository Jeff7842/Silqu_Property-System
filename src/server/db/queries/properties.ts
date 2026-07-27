import { db } from "@/server/db/client";
import type { PropertyStatus, UnitStatus } from "@/generated/prisma/client";

export function listProperties(orgId: string, opts: { status?: PropertyStatus } = {}) {
  return db.property.findMany({
    where: { orgId, status: opts.status },
    include: { _count: { select: { units: true } } },
    orderBy: { name: "asc" },
  });
}

export function getPropertyById(orgId: string, propertyId: string) {
  return db.property.findFirst({
    where: { id: propertyId, orgId },
    include: {
      units: { orderBy: { label: "asc" } },
      caretakerAssignments: { include: { user: true } },
    },
  });
}

export async function getPropertyOccupancy(orgId: string, propertyId: string) {
  const [total, occupied] = await Promise.all([
    db.unit.count({ where: { orgId, propertyId } }),
    db.unit.count({ where: { orgId, propertyId, status: "OCCUPIED" } }),
  ]);
  return { total, occupied, vacant: total - occupied };
}

export function listUnitsForProperty(
  orgId: string,
  propertyId: string,
  opts: { status?: UnitStatus } = {},
) {
  return db.unit.findMany({
    where: { orgId, propertyId, status: opts.status },
    orderBy: { label: "asc" },
  });
}

export function getUnitById(orgId: string, unitId: string) {
  return db.unit.findFirst({
    where: { id: unitId, orgId },
    include: {
      property: true,
      leases: { where: { status: "ACTIVE" }, include: { tenant: true } },
    },
  });
}
