import { db } from "@/server/db/client";
import type { PropertyStatus, UnitStatus } from "@/generated/prisma/client";

export function listProperties(
  orgId: string,
  opts: { status?: PropertyStatus; county?: string; search?: string } = {},
) {
  return db.property.findMany({
    where: {
      orgId,
      status: opts.status,
      county: opts.county,
      ...(opts.search && {
        OR: [
          { name: { contains: opts.search, mode: "insensitive" } },
          { town: { contains: opts.search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: { select: { units: true } },
      units: { where: { status: "OCCUPIED" }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });
}

/** Properties a caretaker can see: those with a property-level or unit-level assignment. */
export async function listPropertiesForCaretaker(orgId: string, userId: string) {
  const assignments = await db.caretakerAssignment.findMany({ where: { userId } });
  const propertyIds = [...new Set(assignments.map((a) => a.propertyId))];

  return db.property.findMany({
    where: { orgId, id: { in: propertyIds } },
    include: {
      _count: { select: { units: true } },
      units: { where: { status: "OCCUPIED" }, select: { id: true } },
    },
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

export function getUnitDetailById(orgId: string, unitId: string) {
  return db.unit.findFirst({
    where: { id: unitId, orgId },
    include: {
      property: true,
      leases: {
        orderBy: { startDate: "desc" },
        include: { tenant: true, payments: { orderBy: { paidAt: "desc" }, take: 10 } },
      },
      maintenanceRequests: { orderBy: { createdAt: "desc" }, take: 10, include: { tenant: true } },
    },
  });
}

export async function isUnitAssignedToCaretaker(userId: string, unitId: string, propertyId: string) {
  const assignment = await db.caretakerAssignment.findFirst({
    where: { userId, OR: [{ unitId }, { propertyId, unitId: null }] },
    select: { id: true },
  });
  return assignment !== null;
}

/** Caretaker-scoped unit detail — returns null if the unit exists but isn't assigned to this caretaker. */
export async function getUnitDetailForCaretaker(orgId: string, unitId: string, userId: string) {
  const unit = await getUnitDetailById(orgId, unitId);
  if (!unit) return null;
  const assigned = await isUnitAssignedToCaretaker(userId, unit.id, unit.propertyId);
  return assigned ? unit : null;
}

export function listVacantUnits(orgId: string) {
  return db.unit.findMany({
    where: { orgId, status: "VACANT" },
    include: { property: true },
    orderBy: [{ property: { name: "asc" } }, { label: "asc" }],
  });
}

export function listCaretakers(orgId: string) {
  return db.user.findMany({
    where: { orgId, role: "CARETAKER", status: "ACTIVE" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
}

export async function unitHasActiveLease(unitId: string) {
  const lease = await db.lease.findFirst({ where: { unitId, status: "ACTIVE" }, select: { id: true } });
  return lease !== null;
}
