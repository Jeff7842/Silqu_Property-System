import { describe, expect, it } from "vitest";
import { computeAllocation, type OpenInvoice } from "@/server/services/billing/allocate-payment";
import { bucketForDays } from "@/server/services/billing/compute-arrears";

describe("computeAllocation", () => {
  it("the worked example: June short 5,000 + July 14,500, pays 16,000", () => {
    const invoices: OpenInvoice[] = [
      { id: "june", balanceCents: 500_000 },
      { id: "july", balanceCents: 1_450_000 },
    ];
    const { allocations, creditCents } = computeAllocation(invoices, 1_600_000);

    expect(allocations).toEqual([
      { invoiceId: "june", appliedCents: 500_000, newBalanceCents: 0 },
      { invoiceId: "july", appliedCents: 1_100_000, newBalanceCents: 350_000 },
    ]);
    expect(creditCents).toBe(0);
  });

  it("settles a single invoice exactly", () => {
    const invoices: OpenInvoice[] = [{ id: "a", balanceCents: 10_000 }];
    const { allocations, creditCents } = computeAllocation(invoices, 10_000);
    expect(allocations).toEqual([{ invoiceId: "a", appliedCents: 10_000, newBalanceCents: 0 }]);
    expect(creditCents).toBe(0);
  });

  it("partially settles when the payment is short", () => {
    const invoices: OpenInvoice[] = [{ id: "a", balanceCents: 10_000 }];
    const { allocations, creditCents } = computeAllocation(invoices, 4_000);
    expect(allocations).toEqual([{ invoiceId: "a", appliedCents: 4_000, newBalanceCents: 6_000 }]);
    expect(creditCents).toBe(0);
  });

  it("overflows to the next invoice when the first is cleared", () => {
    const invoices: OpenInvoice[] = [
      { id: "a", balanceCents: 5_000 },
      { id: "b", balanceCents: 5_000 },
    ];
    const { allocations, creditCents } = computeAllocation(invoices, 8_000);
    expect(allocations).toEqual([
      { invoiceId: "a", appliedCents: 5_000, newBalanceCents: 0 },
      { invoiceId: "b", appliedCents: 3_000, newBalanceCents: 2_000 },
    ]);
    expect(creditCents).toBe(0);
  });

  it("leaves overpayment as a credit once every invoice is cleared", () => {
    const invoices: OpenInvoice[] = [{ id: "a", balanceCents: 5_000 }];
    const { allocations, creditCents } = computeAllocation(invoices, 8_000);
    expect(allocations).toEqual([{ invoiceId: "a", appliedCents: 5_000, newBalanceCents: 0 }]);
    expect(creditCents).toBe(3_000);
  });

  it("with no open invoices, the entire payment becomes a credit", () => {
    const { allocations, creditCents } = computeAllocation([], 5_000);
    expect(allocations).toEqual([]);
    expect(creditCents).toBe(5_000);
  });

  it("skips an invoice that's already fully paid", () => {
    const invoices: OpenInvoice[] = [
      { id: "paid", balanceCents: 0 },
      { id: "open", balanceCents: 5_000 },
    ];
    const { allocations, creditCents } = computeAllocation(invoices, 5_000);
    expect(allocations).toEqual([{ invoiceId: "open", appliedCents: 5_000, newBalanceCents: 0 }]);
    expect(creditCents).toBe(0);
  });

  it("a zero-amount payment allocates nothing", () => {
    const invoices: OpenInvoice[] = [{ id: "a", balanceCents: 5_000 }];
    const { allocations, creditCents } = computeAllocation(invoices, 0);
    expect(allocations).toEqual([]);
    expect(creditCents).toBe(0);
  });
});

describe("bucketForDays", () => {
  it("buckets ageing correctly at the boundaries", () => {
    expect(bucketForDays(0)).toBe("0-30");
    expect(bucketForDays(30)).toBe("0-30");
    expect(bucketForDays(31)).toBe("31-60");
    expect(bucketForDays(60)).toBe("31-60");
    expect(bucketForDays(61)).toBe("61-90");
    expect(bucketForDays(90)).toBe("61-90");
    expect(bucketForDays(91)).toBe("90+");
    expect(bucketForDays(365)).toBe("90+");
  });
});
