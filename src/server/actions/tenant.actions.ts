"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { logAudit } from "@/server/services/audit";
import { generateToken } from "@/server/auth/password";
import { tenantSchema } from "@/server/validators/tenant.schema";

export type ActionState = { error?: string; success?: boolean } | undefined;

const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

async function requireTenantManager() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "onboardTenant")) {
    return { user: null, error: "You don't have permission to manage tenants." } as const;
  }
  return { user, error: null } as const;
}

function fields(formData: FormData) {
  return Object.fromEntries(formData);
}

export async function createTenantAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireTenantManager();
  if (!user) return { error };

  const parsed = tenantSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with that email already exists." };

  const tenant = await db.tenant.create({
    data: { orgId: user.orgId!, ...parsed.data, phone: `254${parsed.data.phone}` },
  });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "tenant.created", entityType: "Tenant", entityId: tenant.id });
  revalidatePath("/app/tenants");
  return { success: true };
}

export async function updateTenantAction(tenantId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireTenantManager();
  if (!user) return { error };

  const parsed = tenantSchema.safeParse(fields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.tenant.findFirst({ where: { id: tenantId, orgId: user.orgId! } });
  if (!existing) return { error: "Tenant not found." };

  await db.tenant.update({ where: { id: tenantId }, data: { ...parsed.data, phone: `254${parsed.data.phone}` } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "tenant.updated", entityType: "Tenant", entityId: tenantId, before: existing, after: parsed.data });
  revalidatePath("/app/tenants");
  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}

export async function archiveTenantAction(tenantId: string): Promise<ActionState> {
  const { user, error } = await requireTenantManager();
  if (!user) return { error };

  const activeLease = await db.lease.findFirst({ where: { tenantId, status: "ACTIVE" } });
  if (activeLease) return { error: "This tenant has an active lease. End the lease before archiving." };

  await db.tenant.update({ where: { id: tenantId, orgId: user.orgId! }, data: { status: "ARCHIVED" } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "tenant.archived", entityType: "Tenant", entityId: tenantId });
  revalidatePath("/app/tenants");
  return { success: true };
}

export async function sendInvitationAction(tenantId: string): Promise<ActionState> {
  const { user, error } = await requireTenantManager();
  if (!user) return { error };

  const tenant = await db.tenant.findFirst({ where: { id: tenantId, orgId: user.orgId! } });
  if (!tenant) return { error: "Tenant not found." };
  if (tenant.userId) return { error: "This tenant already has a login." };
  if (!tenant.email) return { error: "This tenant has no email on file." };

  const { raw, hash } = generateToken();
  const invitation = await db.invitation.create({
    data: {
      orgId: user.orgId!,
      email: tenant.email,
      role: "TENANT",
      tenantId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      createdById: user.id,
    },
  });
  // ponytail: Resend integration is a later phase — log the link so the
  // flow is testable end to end without an email provider wired up yet.
  console.log(`[invitation] ${tenant.email} -> /my/accept-invite?token=${raw}`);
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "invitation.sent", entityType: "Invitation", entityId: invitation.id });
  revalidatePath(`/app/tenants/${tenantId}`);
  revalidatePath("/app/tenants");
  return { success: true };
}

export async function resendInvitationAction(invitationId: string): Promise<ActionState> {
  const { user, error } = await requireTenantManager();
  if (!user) return { error };

  const invitation = await db.invitation.findFirst({ where: { id: invitationId, orgId: user.orgId!, acceptedAt: null } });
  if (!invitation) return { error: "Invitation not found." };

  const { raw, hash } = generateToken();
  await db.invitation.update({
    where: { id: invitationId },
    data: { tokenHash: hash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  console.log(`[invitation] ${invitation.email} -> /my/accept-invite?token=${raw}`);
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "invitation.resent", entityType: "Invitation", entityId: invitationId });
  revalidatePath("/app/tenants");
  return { success: true };
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionState> {
  const { user, error } = await requireTenantManager();
  if (!user) return { error };

  await db.invitation.delete({ where: { id: invitationId, orgId: user.orgId! } });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "invitation.revoked", entityType: "Invitation", entityId: invitationId });
  revalidatePath("/app/tenants");
  return { success: true };
}

export async function confirmTenantDocumentAction(tenantId: string, key: string): Promise<ActionState> {
  const { user, error } = await requireTenantManager();
  if (!user) return { error };

  const tenant = await db.tenant.findFirst({ where: { id: tenantId, orgId: user.orgId! } });
  if (!tenant) return { error: "Tenant not found." };

  const doc = await db.document.create({
    data: { orgId: user.orgId!, entityType: "TENANT", entityId: tenantId, kind: "ID_SCAN", fileKey: key, isPrivate: true, uploadedById: user.id },
  });
  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "document.uploaded", entityType: "Document", entityId: doc.id, after: { tenantId, kind: "ID_SCAN" } });
  revalidatePath(`/app/tenants/${tenantId}`);
  return { success: true };
}
