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
