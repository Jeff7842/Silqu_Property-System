"use server";

import { db } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";
import { signUpStep1Schema } from "@/server/validators/auth.schema";

export type SignUpState = { error?: string; orgId?: string } | undefined;

const PLAN_MONTHLY_UNIT_LIMIT = 50;

export async function createManagerAccountAction(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = signUpStep1Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { firstName, lastName, organizationName, email, phone, county, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const normalizedPhone = `254${phone}`;

  const org = await db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        county,
        phone: normalizedPhone,
        email,
        status: "ACTIVE",
        subscription: {
          create: {
            plan: "MONTHLY",
            status: "PENDING",
            unitLimit: PLAN_MONTHLY_UNIT_LIMIT,
          },
        },
      },
    });
    await tx.user.create({
      data: {
        orgId: organization.id,
        email,
        fullName: `${firstName} ${lastName}`,
        phone: normalizedPhone,
        passwordHash,
        role: "MANAGER",
      },
    });
    return organization;
  });

  return { orgId: org.id };
}

/**
 * ponytail: stub : Daraja STK Push is Phase 8. Marks the subscription
 * ACTIVE immediately, matching the plan's "returns a fake success in dev"
 * instruction, so sign-up is testable end to end before payments exist.
 */
export async function activateSubscriptionStubAction(orgId: string) {
  await db.subscription.update({
    where: { orgId },
    data: { status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });
}
