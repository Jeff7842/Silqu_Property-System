import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db/client";
import { processStkCallbackBody } from "@/server/services/mpesa/process-callback";

// Hits the real dev database (needs DATABASE_URL — see vitest.setup.ts) since
// this specifically proves the callback route's idempotency guard, not just
// the allocation math (that's invoice-payment.spec.ts's job).
describe("M-Pesa callback idempotency", () => {
  const checkoutRequestId = `ws_CO_TEST_${Date.now()}`;
  const mpesaReceipt = `TEST${Date.now()}`;
  let orgId: string, leaseId: string, tenantId: string, invoiceId: string;

  beforeAll(async () => {
    const lease = await db.lease.findFirstOrThrow({ where: { status: "ACTIVE" } });
    orgId = lease.orgId;
    leaseId = lease.id;
    tenantId = lease.tenantId;

    // dueDate is deliberately way in the past so FIFO (oldest-due-first)
    // always processes this invoice before any real seeded arrears on the
    // same lease — combined with an exact-match payment amount below, that
    // guarantees the payment can't spill onto (and corrupt) real data.
    const invoice = await db.invoice.create({
      data: {
        orgId,
        leaseId,
        invoiceNo: `TEST-MPESA-${Date.now()}`,
        periodYear: 2000,
        periodMonth: 1,
        issueDate: new Date("2000-01-01"),
        dueDate: new Date("2000-01-01"),
        totalCents: 500_000,
        paidCents: 0,
        balanceCents: 500_000,
        status: "OPEN",
      },
    });
    invoiceId = invoice.id;

    await db.mpesaTransaction.create({
      data: {
        orgId,
        tenantId,
        leaseId,
        purpose: "RENT",
        checkoutRequestId,
        phone: "254700000000",
        amountCents: 500_000,
        accountRef: "TEST",
        status: "INITIATED",
      },
    });
  }, 30_000);

  afterAll(async () => {
    const payments = await db.payment.findMany({ where: { mpesaReceipt } });
    for (const p of payments) {
      await db.paymentAllocation.deleteMany({ where: { paymentId: p.id } });
    }
    await db.payment.deleteMany({ where: { id: { in: payments.map((p) => p.id) } } });
    await db.mpesaTransaction.deleteMany({ where: { checkoutRequestId } });
    await db.invoice.delete({ where: { id: invoiceId } });
  }, 30_000);

  it("replaying the same callback three times produces exactly one payment", async () => {
    // Real network round trips against Neon (cold WebSocket connection on
    // the first call) comfortably exceed vitest's 5s default for 3 sequential calls.
    const body = {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant",
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 5000 },
              { Name: "MpesaReceiptNumber", Value: mpesaReceipt },
              { Name: "TransactionDate", Value: 20260101120000 },
              { Name: "PhoneNumber", Value: 254700000000 },
            ],
          },
        },
      },
    };

    // Mirrors exactly what /api/mpesa/callback does on each delivery: re-read
    // the transaction, and skip processing entirely once it's COMPLETED.
    for (let i = 0; i < 3; i++) {
      const txn = await db.mpesaTransaction.findUniqueOrThrow({ where: { checkoutRequestId } });
      if (txn.status !== "COMPLETED") {
        await processStkCallbackBody(txn, body);
      }
    }

    const payments = await db.payment.findMany({ where: { mpesaReceipt } });
    expect(payments).toHaveLength(1);
    expect(payments[0].amountCents).toBe(500_000);

    const finalInvoice = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    expect(finalInvoice.status).toBe("PAID");
    expect(finalInvoice.balanceCents).toBe(0);

    const finalTxn = await db.mpesaTransaction.findUniqueOrThrow({ where: { checkoutRequestId } });
    expect(finalTxn.status).toBe("COMPLETED");
  }, 30_000);
});
