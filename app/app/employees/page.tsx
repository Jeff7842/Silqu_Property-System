import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EmployeeForm } from "@/components/employees/employee-form";

const ROLE_TONE = {
  MANAGER: "success",
  CARETAKER: "warning",
  FINANCE: "neutral",
  CUSTOMER_CARE: "neutral",
  OWNER_MANAGER: "success",
} as const;

export default async function EmployeesPage() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);

  if (!hasAccess(user, "inviteManageStaff")) {
    return (
      <Card>
        <EmptyState
          icon="staff"
          title="Employees"
          description="You don't have permission to manage employee accounts."
        />
      </Card>
    );
  }

  const [employees, properties] = await Promise.all([
    db.user.findMany({
      where: { orgId, role: { in: ["MANAGER", "EMPLOYEE", "CARETAKER"] } },
      include: {
        employeeProfile: true,
        caretakerAssignments: {
          include: { property: { select: { id: true, name: true, town: true } } },
          orderBy: { property: { name: "asc" } },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    db.property.findMany({
      where: { orgId, status: "ACTIVE" },
      select: { id: true, name: true, town: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Employees" description="Add staff accounts and assign them to buildings." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card header={<h3 className="font-semibold text-ink">Staff accounts</h3>} padded={false}>
          {employees.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="staff" title="No employees yet" description="Add your first manager, finance user, or caretaker." />
            </div>
          ) : (
            <div className="divide-y divide-line">
              {employees.map((employee) => {
                const role = roleLabel(employee.role, employee.employeeProfile?.subRole ?? null);
                const roleKey = employee.employeeProfile?.subRole ?? employee.role;
                const assigned = uniqueProperties(employee.caretakerAssignments.map((a) => a.property));

                return (
                  <div key={employee.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-ink">{employee.fullName}</h3>
                        <Badge tone={ROLE_TONE[roleKey as keyof typeof ROLE_TONE] ?? "neutral"}>{role}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">{employee.email}</p>
                      {employee.phone && <p className="text-sm text-ink-muted">+{employee.phone}</p>}
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Buildings</p>
                      {assigned.length === 0 ? (
                        <p className="text-sm text-ink-muted">No building assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assigned.map((property) => (
                            <Badge key={property.id} tone="neutral">
                              {property.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card header={<h3 className="font-semibold text-ink">Add employee</h3>}>
          <EmployeeForm properties={properties} />
        </Card>
      </div>
    </div>
  );
}

function roleLabel(role: string, subRole: string | null) {
  if (role === "EMPLOYEE" && subRole) {
    return subRole.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function uniqueProperties<T extends { id: string }>(properties: T[]) {
  const seen = new Set<string>();
  return properties.filter((property) => {
    if (seen.has(property.id)) return false;
    seen.add(property.id);
    return true;
  });
}
