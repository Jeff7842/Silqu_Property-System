"use server";

import { db } from "@/server/db/client";
import { auth as authBusiness } from "@/server/auth/business";
import { auth as authTenant } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { initiateMpesaPayment, type InitiatePaymentResult } from "@/server/services/mpesa/initiate-payment";

const MONTHLY_PRICE_CENTS = 250_000; // KES 2,500 — matches build plan section 10 PLAN_MONTHLY_PRICE

/** Called from the signup wizard, before the manager has a session — the org and its PENDING subscription were just created in the same request chain. `phone` is already 254XXXXXXXXX. */
export async function initiateSignupSubscriptionPaymentAction(orgId: string, phone: string): Promise<InitiatePaymentResult> {
  const sub = await db.subscription.findUnique({ where: { orgId } });
  if (!sub || sub.status === "ACTIVE") {
    return { error: "This subscription is already active." };
  }

  return initiateMpesaPayment({
    orgId,
    purpose: "SUBSCRIPTION",
    phone,
    amountCents: sub.plan === "ANNUAL" ? MONTHLY_PRICE_CENTS * 10 : MONTHLY_PRICE_CENTS,
    accountRef: orgId.slice(0, 12),
    description: "SILQU subscription",
  });
}

/** Called from /app/settings/subscription — manager renewing or reactivating. `phone` is already 254XXXXXXXXX. */
export async function initiateSubscriptionPaymentAction(phone: string): Promise<InitiatePaymentResult> {
  const session = await authBusiness();
  requireRole(session, ["MANAGER"]);
  const orgId = requireOrg(session);

  const sub = await db.subscription.findUnique({ where: { orgId } });
  if (!sub) return { error: "No subscription found." };

  return initiateMpesaPayment({
    orgId,
    purpose: "SUBSCRIPTION",
    phone,
    amountCents: sub.plan === "ANNUAL" ? MONTHLY_PRICE_CENTS * 10 : MONTHLY_PRICE_CENTS,
    accountRef: orgId.slice(0, 12),
    description: "SILQU subscription",
  });
}

/** ponytail: dev-only fallback for /app/settings when M-Pesa isn't configured — mirrors the signup stub so the flow stays testable end to end. */
export async function activateSubscriptionDemoAction() {
  const session = await authBusiness();
  requireRole(session, ["MANAGER"]);
  const orgId = requireOrg(session);

  await db.subscription.update({
    where: { orgId },
    data: { status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });
}

/** Called from /my/payments — tenant paying rent against their active lease. `phone` is already 254XXXXXXXXX. */
export async function initiateRentPaymentAction(phone: string, amountKES: number): Promise<InitiatePaymentResult> {
  const session = await authTenant();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);

  if (!amountKES || amountKES <= 0) return { error: "Enter an amount greater than zero." };

  const tenant = await db.tenant.findFirst({
    where: { orgId, userId: user.id },
    include: { leases: { where: { status: "ACTIVE" }, take: 1 } },
  });
  const lease = tenant?.leases[0];
  if (!tenant || !lease) return { error: "No active lease found." };

  return initiateMpesaPayment({
    orgId,
    tenantId: tenant.id,
    leaseId: lease.id,
    purpose: "RENT",
    phone,
    amountCents: Math.round(amountKES * 100),
    accountRef: lease.id.slice(0, 12),
    description: "Rent payment",
  });
}
