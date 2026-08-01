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
      invitations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export type LedgerEntry =
  | { type: "invoice"; id: string; date: Date; label: string; amountCents: number; runningBalance: number }
  | { type: "payment"; id: string; date: Date; label: string; amountCents: number; runningBalance: number };

/** Invoices and payments merged chronologically (oldest first) with a running balance. */
export async function getTenantLedger(orgId: string, tenantId: string): Promise<LedgerEntry[]> {
  const [invoices, payments] = await Promise.all([
    db.invoice.findMany({ where: { orgId, lease: { tenantId } }, orderBy: { issueDate: "asc" } }),
    db.payment.findMany({ where: { orgId, tenantId, status: "COMPLETED" }, orderBy: { paidAt: "asc" } }),
  ]);

  const events = [
    ...invoices.map((inv) => ({
      type: "invoice" as const,
      id: inv.id,
      date: inv.issueDate,
      label: `Invoice ${inv.invoiceNo}`,
      amountCents: inv.totalCents,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      date: p.paidAt,
      label: `Payment : ${p.method}`,
      amountCents: -p.amountCents,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = 0;
  return events.map((e) => {
    balance += e.amountCents;
    return { ...e, runningBalance: balance };
  });
}
