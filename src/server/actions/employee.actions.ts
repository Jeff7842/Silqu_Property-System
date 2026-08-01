"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { hashPassword } from "@/server/auth/password";
import { logAudit } from "@/server/services/audit";
import { createEmployeeSchema } from "@/server/validators/employee.schema";
import type { EmployeeSubRole, Role } from "@/generated/prisma/client";

export type EmployeeActionState = { error?: string; success?: boolean } | undefined;

async function requireStaffManager() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "inviteManageStaff")) {
    return { user: null, error: "You don't have permission to manage employees." } as const;
  }
  return { user, error: null } as const;
}

function employeeRole(roleType: string): { role: Role; subRole: EmployeeSubRole | null } {
  if (roleType === "MANAGER") return { role: "MANAGER", subRole: null };
  if (roleType === "CARETAKER") return { role: "CARETAKER", subRole: null };
  return { role: "EMPLOYEE", subRole: roleType as EmployeeSubRole };
}

export async function createEmployeeAction(
  _prev: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const { user, error } = await requireStaffManager();
  if (!user) return { error };

  const parsed = createEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    roleType: formData.get("roleType"),
    password: formData.get("password"),
    propertyIds: formData.getAll("propertyIds").filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with that email already exists." };

  const propertyIds = [...new Set(parsed.data.propertyIds)];
  if (propertyIds.length > 0) {
    const count = await db.property.count({
      where: { id: { in: propertyIds }, orgId: user.orgId!, status: "ACTIVE" },
    });
    if (count !== propertyIds.length) return { error: "One or more selected buildings could not be found." };
  }

  const { role, subRole } = employeeRole(parsed.data.roleType);
  const passwordHash = await hashPassword(parsed.data.password);

  const created = await db.$transaction(async (tx) => {
    const staff = await tx.user.create({
      data: {
        orgId: user.orgId!,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ? `254${parsed.data.phone}` : null,
        passwordHash,
        role,
        employeeProfile: subRole ? { create: { subRole } } : undefined,
      },
    });

    if (propertyIds.length > 0) {
      await tx.caretakerAssignment.createMany({
        data: propertyIds.map((propertyId) => ({ userId: staff.id, propertyId })),
        skipDuplicates: true,
      });
    }

    return staff;
  });

  logAudit({
    orgId: user.orgId,
    actorUserId: user.id,
    action: "employee.created",
    entityType: "User",
    entityId: created.id,
    after: { role, subRole, propertyIds },
  });
  revalidatePath("/app/employees");
  return { success: true };
}
