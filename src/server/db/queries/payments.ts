import { db } from "@/server/db/client";
import type { PaymentMethod } from "@/generated/prisma/client";

export function listPayments(
  orgId: string,
  opts: { tenantId?: string; method?: PaymentMethod } = {},
) {
  return db.payment.findMany({
    where: { orgId, tenantId: opts.tenantId, method: opts.method },
    include: { tenant: true, allocations: { include: { invoice: true } } },
    orderBy: { paidAt: "desc" },
  });
}

export function getPaymentById(orgId: string, paymentId: string) {
  return db.payment.findFirst({
    where: { id: paymentId, orgId },
    include: {
      tenant: true,
      lease: { include: { unit: { include: { property: true } } } },
      allocations: { include: { invoice: true } },
    },
  });
}
