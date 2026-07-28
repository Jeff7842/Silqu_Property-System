import { db } from "@/server/db/client";

export type ArrearsBucket = "0-30" | "31-60" | "61-90" | "90+";

export function bucketForDays(daysOverdue: number): ArrearsBucket {
  if (daysOverdue <= 30) return "0-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

export async function computeArrears(orgId: string) {
  const invoices = await db.invoice.findMany({
    where: { orgId, balanceCents: { gt: 0 } },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    orderBy: { dueDate: "asc" },
  });

  const now = Date.now();
  const rows = invoices.map((inv) => {
    const daysOverdue = Math.max(0, Math.floor((now - inv.dueDate.getTime()) / 86_400_000));
    return { invoice: inv, daysOverdue, bucket: bucketForDays(daysOverdue) };
  });

  const buckets: Record<ArrearsBucket, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  for (const r of rows) buckets[r.bucket] += r.invoice.balanceCents;

  return { rows, buckets, totalCents: rows.reduce((sum, r) => sum + r.invoice.balanceCents, 0) };
}
