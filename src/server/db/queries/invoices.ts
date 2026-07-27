import { db } from "@/server/db/client";
import type { InvoiceStatus } from "@/generated/prisma/client";

export function listInvoices(
  orgId: string,
  opts: { status?: InvoiceStatus; leaseId?: string } = {},
) {
  return db.invoice.findMany({
    where: { orgId, status: opts.status, leaseId: opts.leaseId },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });
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
