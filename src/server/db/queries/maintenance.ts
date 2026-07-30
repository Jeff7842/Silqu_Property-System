import { db } from "@/server/db/client";
import type { MaintenanceStatus, MaintenancePriority } from "@/generated/prisma/client";

const DETAIL_INCLUDE = {
  unit: { include: { property: true } },
  tenant: true,
  assignedTo: true,
  comments: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
};

export function listMaintenanceRequests(
  orgId: string,
  opts: { propertyId?: string; status?: MaintenanceStatus; priority?: MaintenancePriority } = {},
) {
  return db.maintenanceRequest.findMany({
    where: {
      orgId,
      status: opts.status,
      priority: opts.priority,
      ...(opts.propertyId && { unit: { propertyId: opts.propertyId } }),
    },
    include: { unit: { include: { property: true } }, tenant: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getMaintenanceRequestById(orgId: string, id: string) {
  return db.maintenanceRequest.findFirst({ where: { id, orgId }, include: DETAIL_INCLUDE });
}

async function caretakerUnitIds(userId: string) {
  const assignments = await db.caretakerAssignment.findMany({ where: { userId } });
  const propertyIds = assignments.filter((a) => !a.unitId).map((a) => a.propertyId);
  const unitIds = assignments.filter((a) => a.unitId).map((a) => a.unitId!);
  return { propertyIds, unitIds };
}

export async function listMaintenanceForCaretaker(orgId: string, userId: string, opts: { status?: MaintenanceStatus } = {}) {
  const { propertyIds, unitIds } = await caretakerUnitIds(userId);
  return db.maintenanceRequest.findMany({
    where: {
      orgId,
      status: opts.status,
      unit: { OR: [{ propertyId: { in: propertyIds } }, { id: { in: unitIds } }] },
    },
    include: { unit: { include: { property: true } }, tenant: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMaintenanceRequestForCaretaker(orgId: string, id: string, userId: string) {
  const request = await getMaintenanceRequestById(orgId, id);
  if (!request) return null;
  const { propertyIds, unitIds } = await caretakerUnitIds(userId);
  const assigned = propertyIds.includes(request.unit.propertyId) || unitIds.includes(request.unitId);
  return assigned ? request : null;
}

export function listMaintenanceForTenant(orgId: string, tenantId: string) {
  return db.maintenanceRequest.findMany({
    where: { orgId, tenantId },
    include: { unit: { include: { property: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function getMaintenanceRequestForTenant(orgId: string, id: string, tenantId: string) {
  return db.maintenanceRequest.findFirst({ where: { id, orgId, tenantId }, include: DETAIL_INCLUDE });
}
