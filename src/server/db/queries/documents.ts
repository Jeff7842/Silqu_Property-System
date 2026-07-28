import { db } from "@/server/db/client";

export function getDocumentById(orgId: string, documentId: string) {
  return db.document.findFirst({ where: { id: documentId, orgId } });
}

export function listTenantDocuments(orgId: string, tenantId: string) {
  return db.document.findMany({
    where: { orgId, entityType: "TENANT", entityId: tenantId },
    orderBy: { createdAt: "desc" },
  });
}

/** For caretaker document-scoping: the unit/property behind a tenant's current active lease, if any. */
export function getTenantActiveUnit(tenantId: string) {
  return db.lease.findFirst({
    where: { tenantId, status: "ACTIVE" },
    select: { unitId: true, unit: { select: { propertyId: true } } },
  });
}
