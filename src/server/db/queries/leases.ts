import { db } from "@/server/db/client";
import type { LeaseStatus } from "@/generated/prisma/client";

export function listLeases(orgId: string, opts: { status?: LeaseStatus } = {}) {
  return db.lease.findMany({
    where: { orgId, status: opts.status },
    include: { unit: { include: { property: true } }, tenant: true },
    orderBy: { startDate: "desc" },
  });
}

export function getLeaseById(orgId: string, leaseId: string) {
  return db.lease.findFirst({
    where: { id: leaseId, orgId },
    include: {
      unit: { include: { property: true } },
      tenant: true,
      invoices: { orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }] },
    },
  });
}

export function getActiveLeaseForUnit(orgId: string, unitId: string) {
  return db.lease.findFirst({
    where: { orgId, unitId, status: "ACTIVE" },
    include: { tenant: true },
  });
}

// Tenant portal lease page starts from the signed-in user, not a unit : resolve
// their Tenant row first, then its current active lease with unit + property.
export async function getActiveLeaseForTenantUser(orgId: string, userId: string) {
  const tenant = await db.tenant.findFirst({
    where: { orgId, userId },
    include: {
      leases: {
        where: { status: "ACTIVE" },
        take: 1,
        include: { unit: { include: { property: true } } },
      },
    },
  });
  return tenant?.leases[0] ?? null;
}
