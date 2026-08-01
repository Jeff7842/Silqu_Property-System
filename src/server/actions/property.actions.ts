"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess, can } from "@/server/auth/permissions";
import { logAudit } from "@/server/services/audit";
import { bustKpiCache } from "@/server/services/redis/kpi-cache";
import { toCents } from "@/lib/money";
import { propertySchema } from "@/server/validators/property.schema";
import { unitSchema, bulkUnitSchema, unitStatusSchema } from "@/server/validators/unit.schema";
import { assignCaretakerSchema } from "@/server/validators/caretaker.schema";
import { unitHasActiveLease, isUnitAssignedToCaretaker } from "@/server/db/queries/properties";

export type ActionState = { error?: string; success?: boolean } | undefined;

async function requirePropertyManager() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "createEditProperty")) {
    return { user: null, error: "You don't have permission to manage properties." } as const;
  }
  return { user, error: null } as const;
}

function fields(formData: FormData) {
  return Object.fromEntries(formData);
}

export async function createPropertyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const parsed = propertySchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const property = await db.property.create({ data: { orgId: user.orgId!, ...parsed.data } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "property.created", entityType: "Property", entityId: property.id, after: parsed.data });
  await bustKpiCache(user.orgId!);
  revalidatePath("/app/properties");
  return { success: true };
}

export async function updatePropertyAction(propertyId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const parsed = propertySchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.property.findFirst({ where: { id: propertyId, orgId: user.orgId! } });
  if (!existing) return { error: "Property not found." };

  await db.property.update({ where: { id: propertyId }, data: parsed.data });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "property.updated", entityType: "Property", entityId: propertyId, before: existing, after: parsed.data });
  await bustKpiCache(user.orgId!);
  revalidatePath("/app/properties");
  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true };
}

export async function archivePropertyAction(propertyId: string): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const occupied = await db.unit.count({ where: { propertyId, status: "OCCUPIED" } });
  if (occupied > 0) {
    return { error: "This property has occupied units. End their leases before archiving." };
  }

  await db.property.update({ where: { id: propertyId, orgId: user.orgId! }, data: { status: "ARCHIVED" } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "property.archived", entityType: "Property", entityId: propertyId });
  await bustKpiCache(user.orgId!);
  revalidatePath("/app/properties");
  return { success: true };
}

export async function setPropertyPhotoAction(propertyId: string, key: string): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const photoUrl = `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
  await db.property.update({ where: { id: propertyId, orgId: user.orgId! }, data: { photoUrl } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "property.photo_updated", entityType: "Property", entityId: propertyId });
  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true };
}

export async function createUnitAction(propertyId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const parsed = unitSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.unit.findFirst({ where: { propertyId, orgId: user.orgId!, label: parsed.data.label } });
  if (existing) return { error: `Unit ${parsed.data.label} already exists on this property.` };

  const unit = await db.unit.create({
    data: {
      orgId: user.orgId!,
      propertyId,
      label: parsed.data.label,
      unitType: parsed.data.unitType,
      bedrooms: parsed.data.bedrooms,
      rentCents: toCents(parsed.data.rentKES),
      depositCents: toCents(parsed.data.depositKES),
    },
  });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "unit.created", entityType: "Unit", entityId: unit.id, after: parsed.data });
  await bustKpiCache(user.orgId!);
  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true };
}

export async function bulkCreateUnitsAction(propertyId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const parsed = bulkUnitSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { prefix, startNumber, endNumber, unitType, bedrooms, rentKES, depositKES } = parsed.data;
  const labels = Array.from({ length: endNumber - startNumber + 1 }, (_, i) => `${prefix}${startNumber + i}`);

  const clash = await db.unit.findFirst({ where: { propertyId, orgId: user.orgId!, label: { in: labels } } });
  if (clash) return { error: `Unit ${clash.label} already exists on this property.` };

  await db.$transaction(
    labels.map((label) =>
      db.unit.create({
        data: {
          orgId: user.orgId!,
          propertyId,
          label,
          unitType,
          bedrooms,
          rentCents: toCents(rentKES),
          depositCents: toCents(depositKES),
        },
      }),
    ),
  );
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "unit.bulk_created", entityType: "Property", entityId: propertyId, after: { labels } });
  await bustKpiCache(user.orgId!);
  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true };
}

export async function updateUnitStatusAction(unitId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const access = can(user, "updateUnitStatus");
  if (access === "none") return { error: "You don't have permission to change unit status." };

  const parsed = unitStatusSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const unit = await db.unit.findFirst({ where: { id: unitId, orgId: user.orgId! } });
  if (!unit) return { error: "Unit not found." };

  if (access === "scoped") {
    const assigned = await isUnitAssignedToCaretaker(user.id, unitId, unit.propertyId);
    if (!assigned) return { error: "You aren't assigned to this unit." };
  }

  if (unit.status === "OCCUPIED" && parsed.data.status !== "OCCUPIED" && (await unitHasActiveLease(unitId))) {
    return { error: "This unit has an active lease. End the lease before changing its status." };
  }

  await db.unit.update({ where: { id: unitId }, data: { status: parsed.data.status } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "unit.status_changed", entityType: "Unit", entityId: unitId, before: { status: unit.status }, after: parsed.data });
  await bustKpiCache(user.orgId!);
  revalidatePath(`/app/properties/${unit.propertyId}`);
  revalidatePath(`/app/properties/${unit.propertyId}/units/${unitId}`);
  return { success: true };
}

export async function assignCaretakerAction(propertyId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const parsed = assignCaretakerSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { userId, unitId } = parsed.data;

  const property = await db.property.findFirst({ where: { id: propertyId, orgId: user.orgId! } });
  if (!property) return { error: "Property not found." };

  const caretaker = await db.user.findFirst({ where: { id: userId, orgId: user.orgId!, role: "CARETAKER" } });
  if (!caretaker) return { error: "Caretaker not found." };

  const already = await db.caretakerAssignment.findFirst({ where: { userId, propertyId, unitId } });
  if (!already) {
    await db.caretakerAssignment.create({ data: { userId, propertyId, unitId } });
  }
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "caretaker.assigned", entityType: "Property", entityId: propertyId, after: { userId, unitId } });
  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true };
}

export async function unassignCaretakerAction(assignmentId: string, propertyId: string): Promise<ActionState> {
  const { user, error } = await requirePropertyManager();
  if (!user) return { error };

  const assignment = await db.caretakerAssignment.findFirst({
    where: { id: assignmentId, property: { orgId: user.orgId! } },
  });
  if (!assignment) return { error: "Assignment not found." };

  await db.caretakerAssignment.delete({ where: { id: assignmentId } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "caretaker.unassigned", entityType: "Property", entityId: propertyId, before: { assignmentId } });
  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true };
}
