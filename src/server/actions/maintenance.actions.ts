"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth as authBusiness } from "@/server/auth/business";
import { auth as authTenant } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { can, hasAccess } from "@/server/auth/permissions";
import { logAudit } from "@/server/services/audit";
import { notify } from "@/server/services/notifications/notify";
import { getMaintenanceRequestForCaretaker } from "@/server/db/queries/maintenance";
import { maintenanceRequestSchema, commentSchema } from "@/server/validators/maintenance.schema";
import { NEXT_MAINTENANCE_STATUS } from "@/lib/maintenance";
import type { MaintenanceStatus } from "@/generated/prisma/client";

export type ActionState = { error?: string; success?: boolean } | undefined;

// ponytail: photo attachment on raise is deferred — the core lifecycle
// (raise -> assign -> in-progress -> resolve -> close, with comments and
// caretaker scoping) is what Phase 9's DoD actually tests; add a private R2
// upload step here the same way tenant ID scans work in Phase 6, if needed.

export async function raiseMaintenanceRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await authTenant();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);

  const parsed = maintenanceRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const tenant = await db.tenant.findFirst({
    where: { orgId, userId: user.id },
    include: { leases: { where: { status: "ACTIVE" }, take: 1 } },
  });
  const lease = tenant?.leases[0];
  if (!tenant || !lease) return { error: "You don't have an active lease." };

  const request = await db.maintenanceRequest.create({
    data: {
      orgId,
      unitId: lease.unitId,
      tenantId: tenant.id,
      propertyId: (await db.unit.findUniqueOrThrow({ where: { id: lease.unitId } })).propertyId,
      category: parsed.data.category,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "OPEN",
    },
  });

  logAudit({ orgId, actorUserId: user.id, action: "maintenance.raised", entityType: "MaintenanceRequest", entityId: request.id });
  revalidatePath("/my/maintenance");
  revalidatePath("/app/maintenance");
  return { success: true };
}

async function requireMaintenanceStaff() {
  const session = await authBusiness();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);
  return { user, orgId };
}

export async function assignMaintenanceAction(requestId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, orgId } = await requireMaintenanceStaff();
  if (!hasAccess(user, "resolveMaintenanceRequest")) return { error: "You don't have permission to assign requests." };

  const caretakerId = String(formData.get("caretakerId") ?? "");
  const caretaker = await db.user.findFirst({ where: { id: caretakerId, orgId, role: "CARETAKER" } });
  if (!caretaker) return { error: "Choose a caretaker." };

  const request = await db.maintenanceRequest.findFirst({ where: { id: requestId, orgId } });
  if (!request) return { error: "Request not found." };

  await db.maintenanceRequest.update({ where: { id: requestId }, data: { assignedToId: caretakerId, status: "ASSIGNED" } });
  logAudit({ orgId, actorUserId: user.id, action: "maintenance.assigned", entityType: "MaintenanceRequest", entityId: requestId, after: { caretakerId } });

  if (caretaker.orgId) {
    await notify(caretaker.id, { type: "maintenance.assigned", title: "New maintenance assignment", body: request.description.slice(0, 120), link: `/app/maintenance/${requestId}` });
  }

  revalidatePath(`/app/maintenance/${requestId}`);
  revalidatePath("/app/maintenance");
  return { success: true };
}

export async function updateMaintenanceStatusAction(requestId: string, status: MaintenanceStatus): Promise<ActionState> {
  const sessionBusiness = await authBusiness();
  const sessionTenant = await authTenant();
  const businessUser = sessionBusiness?.user ? requireRole(sessionBusiness, ["MANAGER", "EMPLOYEE", "CARETAKER"]) : null;
  const tenantUser = sessionTenant?.user ? requireRole(sessionTenant, ["TENANT"]) : null;
  const actor = businessUser ?? tenantUser;
  if (!actor) return { error: "Not signed in." };

  const orgId = businessUser ? requireOrg(sessionBusiness) : requireOrg(sessionTenant);
  const request = await db.maintenanceRequest.findFirst({ where: { id: requestId, orgId } });
  if (!request) return { error: "Request not found." };

  if (!NEXT_MAINTENANCE_STATUS[request.status].includes(status)) {
    return { error: `A ${request.status.toLowerCase()} request can't move to ${status.toLowerCase()}.` };
  }

  // Only the raising tenant or a manager may CLOSE — "resolved" otherwise means nothing.
  if (status === "CLOSED") {
    const isRaisingTenant = tenantUser && request.tenantId && (await db.tenant.findFirst({ where: { id: request.tenantId, userId: tenantUser.id } }));
    const isManager = businessUser?.role === "MANAGER";
    if (!isRaisingTenant && !isManager) return { error: "Only the tenant who raised this, or a manager, can close it." };
  } else if (businessUser) {
    const access = can(businessUser, "resolveMaintenanceRequest");
    if (access === "none") return { error: "You don't have permission to update this request." };
    if (access === "scoped") {
      const scoped = await getMaintenanceRequestForCaretaker(orgId, requestId, businessUser.id);
      if (!scoped) return { error: "You aren't assigned to this unit." };
    }
  } else if (tenantUser) {
    return { error: "Only staff can make this change." };
  }

  await db.maintenanceRequest.update({
    where: { id: requestId },
    data: { status, resolvedAt: status === "RESOLVED" ? new Date() : request.resolvedAt },
  });
  logAudit({ orgId, actorUserId: actor.id, action: "maintenance.status_changed", entityType: "MaintenanceRequest", entityId: requestId, before: { status: request.status }, after: { status } });

  if (request.tenantId && status === "RESOLVED") {
    const tenant = await db.tenant.findUnique({ where: { id: request.tenantId } });
    if (tenant?.userId) {
      await notify(tenant.userId, { type: "maintenance.status_changed", title: "Maintenance request resolved", body: "Your maintenance request has been marked resolved. Let us know if it's fixed.", link: "/my/maintenance" });
    }
  }

  revalidatePath(`/app/maintenance/${requestId}`);
  revalidatePath("/app/maintenance");
  revalidatePath("/my/maintenance");
  return { success: true };
}

export async function addMaintenanceCommentAction(requestId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const sessionBusiness = await authBusiness();
  const sessionTenant = await authTenant();
  const businessUser = sessionBusiness?.user ? requireRole(sessionBusiness, ["MANAGER", "EMPLOYEE", "CARETAKER"]) : null;
  const tenantUser = sessionTenant?.user ? requireRole(sessionTenant, ["TENANT"]) : null;
  const actor = businessUser ?? tenantUser;
  if (!actor) return { error: "Not signed in." };

  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const orgId = businessUser ? requireOrg(sessionBusiness) : requireOrg(sessionTenant);
  const request = await db.maintenanceRequest.findFirst({ where: { id: requestId, orgId } });
  if (!request) return { error: "Request not found." };

  if (businessUser) {
    const access = can(businessUser, "resolveMaintenanceRequest");
    if (access === "scoped") {
      const scoped = await getMaintenanceRequestForCaretaker(orgId, requestId, businessUser.id);
      if (!scoped) return { error: "You aren't assigned to this unit." };
    }
  } else if (tenantUser && request.tenantId) {
    const owns = await db.tenant.findFirst({ where: { id: request.tenantId, userId: tenantUser.id } });
    if (!owns) return { error: "This isn't your request." };
  }

  await db.maintenanceComment.create({ data: { requestId, userId: actor.id, body: parsed.data.body } });
  revalidatePath(`/app/maintenance/${requestId}`);
  revalidatePath(`/my/maintenance/${requestId}`);
  return { success: true };
}
