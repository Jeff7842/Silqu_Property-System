"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { logAudit } from "@/server/services/audit";
import { bustKpiCache } from "@/server/services/redis/kpi-cache";
import { toCents } from "@/lib/money";
import { leaseSchema } from "@/server/validators/lease.schema";
import type { LeaseStatus } from "@/generated/prisma/client";

export type ActionState = { error?: string; success?: boolean } | undefined;

// PENDING covers a lease signed for a future start date; everything else
// is a terminal state once reached (no un-ending or un-terminating).
const ALLOWED_TRANSITIONS: Record<LeaseStatus, LeaseStatus[]> = {
  PENDING: ["ACTIVE", "TERMINATED"],
  ACTIVE: ["ENDED", "TERMINATED"],
  ENDED: [],
  TERMINATED: [],
};

async function requireLeaseManager() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "createEndLease")) {
    return { user: null, error: "You don't have permission to manage leases." } as const;
  }
  return { user, error: null } as const;
}

export async function createLeaseAction(tenantId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireLeaseManager();
  if (!user) return { error };

  const parsed = leaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const tenant = await db.tenant.findFirst({ where: { id: tenantId, orgId: user.orgId! } });
  if (!tenant) return { error: "Tenant not found." };

  const unit = await db.unit.findFirst({ where: { id: parsed.data.unitId, orgId: user.orgId! } });
  if (!unit) return { error: "Unit not found." };
  if (unit.status !== "VACANT") {
    return { error: "This unit isn't vacant. End the current lease before assigning a new tenant." };
  }

  const status: LeaseStatus = parsed.data.startDate <= new Date() ? "ACTIVE" : "PENDING";

  try {
    await db.$transaction(async (tx) => {
      // Re-check inside the transaction to close the race between the read above and this write.
      const stillVacant = await tx.unit.findFirst({ where: { id: unit.id, status: "VACANT" } });
      if (!stillVacant) throw new Error("UNIT_NO_LONGER_VACANT");

      await tx.lease.create({
        data: {
          orgId: user.orgId!,
          unitId: unit.id,
          tenantId,
          startDate: parsed.data.startDate,
          endDate: parsed.data.endDate,
          rentCents: toCents(parsed.data.rentKES),
          depositCents: toCents(parsed.data.depositKES),
          billingDay: parsed.data.billingDay,
          status,
        },
      });
      if (status === "ACTIVE") {
        await tx.unit.update({ where: { id: unit.id }, data: { status: "OCCUPIED" } });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNIT_NO_LONGER_VACANT") {
      return { error: "This unit isn't vacant. End the current lease before assigning a new tenant." };
    }
    throw e;
  }

  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "lease.created", entityType: "Tenant", entityId: tenantId, after: { unitId: unit.id, status } });
  await bustKpiCache(user.orgId!);
  revalidatePath(`/app/tenants/${tenantId}`);
  revalidatePath(`/app/properties/${unit.propertyId}`);
  return { success: true };
}

async function transitionLease(leaseId: string, to: LeaseStatus) {
  const { user, error } = await requireLeaseManager();
  if (!user) return { error };

  const lease = await db.lease.findFirst({ where: { id: leaseId, orgId: user.orgId! } });
  if (!lease) return { error: "Lease not found." };
  if (!ALLOWED_TRANSITIONS[lease.status].includes(to)) {
    return { error: `A ${lease.status.toLowerCase()} lease can't move to ${to.toLowerCase()}.` };
  }

  await db.$transaction([
    db.lease.update({ where: { id: leaseId }, data: { status: to } }),
    ...(lease.status === "ACTIVE" && (to === "ENDED" || to === "TERMINATED")
      ? [db.unit.update({ where: { id: lease.unitId }, data: { status: "VACANT" as const } })]
      : []),
    ...(to === "ACTIVE" ? [db.unit.update({ where: { id: lease.unitId }, data: { status: "OCCUPIED" as const } })] : []),
  ]);

  logAudit({ orgId: user.orgId, actorUserId: user.id, action: `lease.${to.toLowerCase()}`, entityType: "Lease", entityId: leaseId, before: { status: lease.status }, after: { status: to } });
  await bustKpiCache(user.orgId!);
  revalidatePath(`/app/tenants/${lease.tenantId}`);
  revalidatePath(`/app/properties/${lease.unitId}`);
  return { success: true };
}

export async function activateLeaseAction(leaseId: string): Promise<ActionState> {
  return transitionLease(leaseId, "ACTIVE");
}

export async function endLeaseAction(leaseId: string): Promise<ActionState> {
  return transitionLease(leaseId, "ENDED");
}

export async function terminateLeaseAction(leaseId: string): Promise<ActionState> {
  return transitionLease(leaseId, "TERMINATED");
}

export async function renewLeaseAction(leaseId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireLeaseManager();
  if (!user) return { error };

  const newEndDate = new Date(String(formData.get("endDate")));
  if (Number.isNaN(newEndDate.getTime())) return { error: "Choose a valid date." };

  const lease = await db.lease.findFirst({ where: { id: leaseId, orgId: user.orgId! } });
  if (!lease) return { error: "Lease not found." };
  if (lease.status !== "ACTIVE") return { error: "Only an active lease can be renewed." };
  if (newEndDate <= lease.endDate) return { error: "New end date must be after the current end date." };

  await db.lease.update({ where: { id: leaseId }, data: { endDate: newEndDate } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "lease.renewed", entityType: "Lease", entityId: leaseId, before: { endDate: lease.endDate }, after: { endDate: newEndDate } });
  revalidatePath(`/app/tenants/${lease.tenantId}`);
  return { success: true };
}
