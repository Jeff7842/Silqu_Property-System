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
