import { db } from "@/server/db/client";

/** Platform portal only : every org across every tenant, not org-scoped by design. */
export function listAllOrganizations() {
  return db.organization.findMany({
    select: {
      id: true,
      name: true,
      county: true,
      status: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

/** Platform portal only : single org detail for the support-session view. */
export function getOrganizationById(orgId: string) {
  return db.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      county: true,
      phone: true,
      email: true,
      status: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true, unitLimit: true, currentPeriodEnd: true } },
      _count: { select: { properties: true, tenants: true, users: true } },
    },
  });
}
