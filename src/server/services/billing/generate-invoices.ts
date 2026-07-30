import { db } from "@/server/db/client";
import { notify } from "@/server/services/notifications/notify";

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
  // Tracked so we can notify tenants once the transaction has actually
  // committed — notify() does its own DB write plus an external publishJob
  // call, neither of which is safe to run inside a live DB transaction.
  const createdInvoices: { invoiceId: string; tenantUserId: string | null }[] = [];

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
        createdInvoices.push({ invoiceId: invoice.id, tenantUserId: lease.tenant.userId });
      }
    },
    { maxWait: 5000, timeout: 20000 },
  );

  // Fire the "invoice issued" notification per lease, isolated from the run:
  // a tenant with no portal account yet (tenantUserId null) is skipped, and
  // one notify() failure is logged and swallowed rather than thrown — every
  // invoice above is already committed, so a notification hiccup for one
  // tenant must never look like the whole generation run failed (rule 12).
  for (const { invoiceId, tenantUserId } of createdInvoices) {
    if (!tenantUserId) continue;
    try {
      await notify(tenantUserId, {
        type: "invoice.issued",
        title: "New invoice issued",
        body: "A new invoice is ready for your lease. Check your balance and pay via M-Pesa.",
        link: "/my/payments",
      });
    } catch (e) {
      console.error("[notify] invoice.issued failed for invoice", invoiceId, e);
    }
  }

  return { created: toCreate.length };
}
