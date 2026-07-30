import { db } from "@/server/db/client";
import type { MpesaStatus } from "@/generated/prisma/client";

export function listMpesaTransactions(orgId: string, opts: { status?: MpesaStatus } = {}) {
  return db.mpesaTransaction.findMany({
    where: { orgId, status: opts.status },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getMpesaTransactionById(id: string) {
  return db.mpesaTransaction.findUnique({ where: { id } });
}

/** Platform portal only — not org-scoped by design. */
export function listAllMpesaTransactions(opts: { status?: MpesaStatus } = {}) {
  return db.mpesaTransaction.findMany({
    where: { status: opts.status },
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Platform health page — failure rate across every org's M-Pesa traffic in the last 24h. */
export async function getMpesaFailureRate24h() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const counts = await db.mpesaTransaction.groupBy({
    by: ["status"],
    where: { createdAt: { gte: since } },
    _count: true,
  });

  const total = counts.reduce((sum, c) => sum + c._count, 0);
  const failed = counts.reduce((sum, c) => (c.status === "FAILED" || c.status === "TIMEOUT" ? sum + c._count : sum), 0);

  return {
    total,
    failed,
    failureRatePercent: total === 0 ? 0 : Math.round((failed / total) * 1000) / 10,
  };
}
