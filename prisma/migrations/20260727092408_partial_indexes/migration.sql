-- Hand-written migration (Prisma's schema DSL can't express partial unique
-- indexes or CHECK constraints). See docs/SILQU_BUILD_PLAN_V2.md section 5.5.

-- One ACTIVE lease per unit. Prevents double-letting a door: a second
-- ACTIVE lease insert on an already-let unit fails here, cheaply, instead
-- of silently producing two tenants "in" the same unit.
CREATE UNIQUE INDEX "one_active_lease_per_unit"
  ON "leases" ("unitId")
  WHERE "status" = 'ACTIVE';

-- Money sanity + the Int cap this schema relies on (section 5.3):
-- 2,147,483,647 cents = KES 21,474,836 per row. Transactional amounts must
-- be strictly positive; running totals may legitimately be zero (e.g. a
-- fully paid invoice has balanceCents = 0).
ALTER TABLE "units" ADD CONSTRAINT "units_rent_cents_range"
  CHECK ("rentCents" >= 0 AND "rentCents" <= 2147483647);
ALTER TABLE "units" ADD CONSTRAINT "units_deposit_cents_range"
  CHECK ("depositCents" >= 0 AND "depositCents" <= 2147483647);

ALTER TABLE "leases" ADD CONSTRAINT "leases_rent_cents_range"
  CHECK ("rentCents" >= 0 AND "rentCents" <= 2147483647);
ALTER TABLE "leases" ADD CONSTRAINT "leases_deposit_cents_range"
  CHECK ("depositCents" >= 0 AND "depositCents" <= 2147483647);

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_total_cents_range"
  CHECK ("totalCents" >= 0 AND "totalCents" <= 2147483647);
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paid_cents_range"
  CHECK ("paidCents" >= 0 AND "paidCents" <= 2147483647);
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_balance_cents_range"
  CHECK ("balanceCents" >= 0 AND "balanceCents" <= 2147483647);

ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_amount_cents_positive"
  CHECK ("amountCents" > 0 AND "amountCents" <= 2147483647);

ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_cents_positive"
  CHECK ("amountCents" > 0 AND "amountCents" <= 2147483647);

-- A payment can never be allocated to more than it is worth. This is the
-- backstop; the allocation engine (Phase 7) enforces it in the transaction.
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_amount_cents_positive"
  CHECK ("amountCents" > 0 AND "amountCents" <= 2147483647);

ALTER TABLE "mpesa_transactions" ADD CONSTRAINT "mpesa_transactions_amount_cents_positive"
  CHECK ("amountCents" > 0 AND "amountCents" <= 2147483647);
