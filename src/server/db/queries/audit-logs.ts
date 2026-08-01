import { db } from "@/server/db/client";

export type AuditLogFilters = {
  orgId?: string;
  action?: string;
  from?: Date;
  to?: Date;
};

/** Platform portal only : audit trail across every org, not org-scoped by design (viewOwnOrgAuditLog covers the business portal's own-org view). */
export function listAuditLogs(filters: AuditLogFilters = {}) {
  return db.auditLog.findMany({
    where: {
      orgId: filters.orgId || undefined,
      action: filters.action ? { contains: filters.action, mode: "insensitive" } : undefined,
      createdAt: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined,
    },
    include: {
      organization: { select: { name: true } },
      actorUser: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

/** Populates the organization filter dropdown. */
export function listOrganizationsForFilter() {
  return db.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}
