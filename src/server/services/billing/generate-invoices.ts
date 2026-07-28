import { db } from "@/server/db/client";

async function leasesMissingInvoice(orgId: string, year: number, month: number) {
  const leases = await db.lease.findMany({
    where: { orgId, status: "ACTIVE" },
    include: { unit: { include: { property: true } }, tenant: true },
  });
  if (leases.length === 0) return [];

  const existing = await db.invoice.findMany({
    where: { orgId, periodYear: year, periodMonth: month, leaseId: { in: leases.map((l) => l.id) } },
    select: { leaseId: true },
  });
  const existingSet = new Set(existing.map((e) => e.leaseId));
  return leases.filter((l) => !existingSet.has(l.id));
}

export async function previewInvoiceGeneration(orgId: string, year: number, month: number) {
  const toCreate = await leasesMissingInvoice(orgId, year, month);
  const totalCents = toCreate.reduce((sum, l) => sum + l.rentCents, 0);

  const byProperty = new Map<string, { propertyName: string; count: number; totalCents: number }>();
  for (const lease of toCreate) {
    const key = lease.unit.propertyId;
    const entry = byProperty.get(key) ?? { propertyName: lease.unit.property.name, count: 0, totalCents: 0 };
    entry.count += 1;
    entry.totalCents += lease.rentCents;
    byProperty.set(key, entry);
  }

  return { count: toCreate.length, totalCents, byProperty: [...byProperty.values()] };
}

/** Idempotent: re-running for a period that's already fully invoiced creates nothing. */
export async function generateInvoicesForPeriod(orgId: string, year: number, month: number) {
  const toCreate = await leasesMissingInvoice(orgId, year, month);
  if (toCreate.length === 0) return { created: 0 };

  const issueDate = new Date();
  await db.$transaction(
    async (tx) => {
      for (const lease of toCreate) {
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const dueDate = new Date(year, month - 1, Math.min(lease.billingDay, lastDayOfMonth));

        const invoice = await tx.invoice.create({
          data: {
            orgId,
            leaseId: lease.id,
            invoiceNo: `INV-${year}${String(month).padStart(2, "0")}-${lease.id.slice(-6).toUpperCase()}`,
            periodYear: year,
            periodMonth: month,
            issueDate,
            dueDate,
            totalCents: lease.rentCents,
            paidCents: 0,
            balanceCents: lease.rentCents,
            status: "OPEN",
          },
        });
        await tx.invoiceLine.create({
          data: { invoiceId: invoice.id, category: "RENT", description: "Monthly rent", amountCents: lease.rentCents },
        });
      }
    },
    { maxWait: 5000, timeout: 20000 },
  );

  return { created: toCreate.length };
}
