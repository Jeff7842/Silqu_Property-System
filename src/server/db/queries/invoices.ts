import { db } from "@/server/db/client";
import type { InvoiceStatus } from "@/generated/prisma/client";

export async function listInvoices(
  orgId: string,
  opts: { status?: InvoiceStatus; leaseId?: string; propertyId?: string; periodYear?: number; periodMonth?: number } = {},
) {
  const where = {
    orgId,
    status: opts.status,
    leaseId: opts.leaseId,
    periodYear: opts.periodYear,
    periodMonth: opts.periodMonth,
    ...(opts.propertyId && { lease: { unit: { propertyId: opts.propertyId } } }),
  };

  const [invoices, totals] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    db.invoice.aggregate({ where, _sum: { totalCents: true, paidCents: true, balanceCents: true }, _count: true }),
  ]);

  return {
    invoices,
    totals: {
      count: totals._count,
      totalCents: totals._sum.totalCents ?? 0,
      paidCents: totals._sum.paidCents ?? 0,
      balanceCents: totals._sum.balanceCents ?? 0,
    },
  };
}

export function getInvoiceById(orgId: string, invoiceId: string) {
  return db.invoice.findFirst({
    where: { id: invoiceId, orgId },
    include: {
      lines: true,
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
      allocations: { include: { payment: true } },
    },
  });
}

export async function getArrearsTotal(orgId: string) {
  const result = await db.invoice.aggregate({
    where: { orgId, balanceCents: { gt: 0 } },
    _sum: { balanceCents: true },
    _count: true,
  });
  return { totalCents: result._sum.balanceCents ?? 0, invoiceCount: result._count };
}
