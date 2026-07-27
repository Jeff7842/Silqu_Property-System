import { db } from "@/server/db/client";
import type { TenantStatus } from "@/generated/prisma/client";

export function listTenants(
  orgId: string,
  opts: { status?: TenantStatus; search?: string } = {},
) {
  return db.tenant.findMany({
    where: {
      orgId,
      status: opts.status,
      ...(opts.search && {
        OR: [
          { fullName: { contains: opts.search, mode: "insensitive" } },
          { phone: { contains: opts.search } },
        ],
      }),
    },
    include: {
      leases: { where: { status: "ACTIVE" }, include: { unit: true } },
    },
    orderBy: { fullName: "asc" },
  });
}

export function getTenantById(orgId: string, tenantId: string) {
  return db.tenant.findFirst({
    where: { id: tenantId, orgId },
    include: {
      leases: { include: { unit: { include: { property: true } } }, orderBy: { startDate: "desc" } },
      payments: { orderBy: { paidAt: "desc" } },
      maintenanceRequests: { orderBy: { createdAt: "desc" } },
    },
  });
}
