import { db } from "@/server/db/client";

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end, year: date.getFullYear(), month: date.getMonth() + 1 };
}

export async function getManagerDashboardStats(orgId: string) {
  const { year, month } = monthRange();

  const [
    propertyCount,
    totalUnits,
    occupiedUnits,
    monthInvoices,
    arrears,
    recentPayments,
    unpaidInvoices,
    properties,
  ] = await Promise.all([
    db.property.count({ where: { orgId, status: "ACTIVE" } }),
    db.unit.count({ where: { orgId } }),
    db.unit.count({ where: { orgId, status: "OCCUPIED" } }),
    db.invoice.aggregate({
      where: { orgId, periodYear: year, periodMonth: month },
      _sum: { totalCents: true, paidCents: true },
    }),
    db.invoice.aggregate({
      where: { orgId, balanceCents: { gt: 0 } },
      _sum: { balanceCents: true },
      _count: true,
    }),
    db.payment.findMany({
      where: { orgId, status: "COMPLETED" },
      orderBy: { paidAt: "desc" },
      take: 5,
      include: { tenant: true },
    }),
    db.invoice.findMany({
      where: { orgId, balanceCents: { gt: 0 } },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    }),
    db.property.findMany({
      where: { orgId, status: "ACTIVE" },
      include: { _count: { select: { units: true } }, units: { where: { status: "OCCUPIED" }, select: { id: true } } },
    }),
  ]);

  return {
    propertyCount,
    totalUnits,
    occupiedUnits,
    occupancyRate: totalUnits ? occupiedUnits / totalUnits : 0,
    expectedCents: monthInvoices._sum.totalCents ?? 0,
    collectedCents: monthInvoices._sum.paidCents ?? 0,
    arrearsCents: arrears._sum.balanceCents ?? 0,
    arrearsTenantCount: arrears._count,
    recentPayments,
    unpaidInvoices,
    occupancyByProperty: properties.map((p) => ({
      id: p.id,
      name: p.name,
      total: p._count.units,
      occupied: p.units.length,
    })),
  };
}

export async function getFinanceDashboardStats(orgId: string) {
  const { start, end } = monthRange();

  const [collectedToday, collectedMonth, unpaidCount, arrears] = await Promise.all([
    db.payment.aggregate({
      where: { orgId, status: "COMPLETED", paidAt: { gte: new Date(new Date().toDateString()) } },
      _sum: { amountCents: true },
    }),
    db.payment.aggregate({
      where: { orgId, status: "COMPLETED", paidAt: { gte: start, lt: end } },
      _sum: { amountCents: true },
    }),
    db.invoice.count({ where: { orgId, balanceCents: { gt: 0 } } }),
    db.invoice.findMany({
      where: { orgId, balanceCents: { gt: 0 } },
      orderBy: { balanceCents: "desc" },
      take: 8,
      include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    }),
  ]);

  return {
    collectedTodayCents: collectedToday._sum.amountCents ?? 0,
    collectedMonthCents: collectedMonth._sum.amountCents ?? 0,
    unpaidInvoiceCount: unpaidCount,
    topArrears: arrears,
  };
}

export async function getCareDashboardStats(orgId: string) {
  const { start } = monthRange();

  const [openMaintenance, newTenants, requests] = await Promise.all([
    db.maintenanceRequest.count({ where: { orgId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } } }),
    db.tenant.count({ where: { orgId, createdAt: { gte: start } } }),
    db.maintenanceRequest.findMany({
      where: { orgId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { unit: { include: { property: true } }, tenant: true },
    }),
  ]);

  return { openMaintenance, newTenants, requests };
}

export async function getCaretakerDashboardStats(orgId: string, userId: string) {
  const assignments = await db.caretakerAssignment.findMany({ where: { userId } });
  const propertyIds = assignments.filter((a) => !a.unitId).map((a) => a.propertyId);
  const unitIds = assignments.filter((a) => a.unitId).map((a) => a.unitId!);

  const unitWhere = {
    orgId,
    OR: [{ propertyId: { in: propertyIds } }, { id: { in: unitIds } }],
  };

  const [units, openMaintenance, requests] = await Promise.all([
    db.unit.findMany({
      where: unitWhere,
      include: { leases: { where: { status: "ACTIVE" }, include: { tenant: true } }, property: true },
      orderBy: { label: "asc" },
    }),
    db.maintenanceRequest.count({
      where: { orgId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] }, unit: unitWhere },
    }),
    db.maintenanceRequest.findMany({
      where: { orgId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] }, unit: unitWhere },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { unit: true },
    }),
  ]);

  const occupied = units.filter((u) => u.status === "OCCUPIED").length;

  return {
    units,
    unitCount: units.length,
    occupancyRate: units.length ? occupied / units.length : 0,
    openMaintenance,
    requests,
  };
}

export async function getTenantDashboardStats(orgId: string, userId: string) {
  const tenant = await db.tenant.findFirst({ where: { orgId, userId }, select: { id: true } });
  if (!tenant) return null;
  const tenantId = tenant.id;

  const lease = await db.lease.findFirst({
    where: { orgId, tenantId, status: "ACTIVE" },
    include: { unit: { include: { property: true } } },
  });

  const [invoices, lastPayment, openRequests, announcements] = await Promise.all([
    db.invoice.findMany({
      where: { orgId, lease: { tenantId } },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      take: 6,
    }),
    db.payment.findFirst({
      where: { orgId, tenantId, status: "COMPLETED" },
      orderBy: { paidAt: "desc" },
    }),
    db.maintenanceRequest.count({
      where: { orgId, tenantId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    db.announcement.findMany({
      where: {
        orgId,
        publishedAt: { not: null },
        OR: [
          { audience: "ALL" },
          ...(lease ? [{ audience: "PROPERTY" as const, propertyId: lease.unit.propertyId }, { audience: "UNIT" as const, unitId: lease.unitId }] : []),
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  const balanceCents = invoices.reduce((sum, inv) => sum + inv.balanceCents, 0);
  const nextDue = invoices.find((inv) => inv.balanceCents > 0);
  const totalPaidThisYear = invoices
    .filter((inv) => inv.periodYear === new Date().getFullYear())
    .reduce((sum, inv) => sum + inv.paidCents, 0);

  return { lease, invoices, lastPayment, openRequests, announcements, balanceCents, nextDue, totalPaidThisYear };
}

export async function getPlatformDashboardStats() {
  const MONTHLY_PRICE_CENTS = 250000; // KES 2,500
  const ANNUAL_PRICE_CENTS = 2500000; // KES 25,000

  const { start } = monthRange();

  const [orgCount, subscriptions, newOrgsThisMonth] = await Promise.all([
    db.organization.count(),
    db.subscription.findMany({ where: { status: "ACTIVE" } }),
    db.organization.count({ where: { createdAt: { gte: start } } }),
  ]);

  const mrrCents = subscriptions.reduce(
    (sum, s) => sum + (s.plan === "MONTHLY" ? MONTHLY_PRICE_CENTS : Math.round(ANNUAL_PRICE_CENTS / 12)),
    0,
  );

  return {
    orgCount,
    activeSubscriptions: subscriptions.length,
    mrrCents,
    newOrgsThisMonth,
    failedJobs: 0, // QStash isn't wired up until Phase 7
    mpesaFailureRate24h: 0, // no live M-Pesa traffic until Phase 8
  };
}
