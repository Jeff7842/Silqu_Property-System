import type { Role, EmployeeSubRole } from "@/generated/prisma/client";
import type { IconName } from "@/lib/icons";
import type { Portal } from "@/server/auth/portals";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  portal: Portal;
  roles: Role[];
  subRoles?: EmployeeSubRole[];
};

export const NAV_ITEMS: NavItem[] = [
  // Business portal
  { href: "/app", label: "Dashboard", icon: "dashboard", portal: "business", roles: ["MANAGER", "EMPLOYEE"] },
  { href: "/app", label: "My Units", icon: "myUnits", portal: "business", roles: ["CARETAKER"] },
  { href: "/app/properties", label: "Properties", icon: "properties", portal: "business", roles: ["MANAGER", "EMPLOYEE"] },
  { href: "/app/tenants", label: "Tenants", icon: "tenants", portal: "business", roles: ["MANAGER", "EMPLOYEE"] },
  { href: "/app/invoices", label: "Financials", icon: "payments", portal: "business", roles: ["MANAGER", "EMPLOYEE"] },
  { href: "/app/maintenance", label: "Maintenance", icon: "maintenance", portal: "business", roles: ["MANAGER", "EMPLOYEE", "CARETAKER"] },
  { href: "/app/announcements", label: "Announcements", icon: "announcements", portal: "business", roles: ["MANAGER", "EMPLOYEE"] },
  { href: "/app/reports", label: "Reports", icon: "reports", portal: "business", roles: ["MANAGER", "EMPLOYEE"] },
  { href: "/app/settings", label: "Settings", icon: "settings", portal: "business", roles: ["MANAGER", "EMPLOYEE", "CARETAKER"] },

  // Tenant portal
  { href: "/my", label: "Dashboard", icon: "dashboard", portal: "tenant", roles: ["TENANT"] },
  { href: "/my/payments", label: "Payments", icon: "payments", portal: "tenant", roles: ["TENANT"] },
  { href: "/my/lease", label: "Lease Agreement", icon: "leases", portal: "tenant", roles: ["TENANT"] },
  { href: "/my/maintenance", label: "Maintenance", icon: "maintenance", portal: "tenant", roles: ["TENANT"] },
  { href: "/my/profile", label: "Settings", icon: "settings", portal: "tenant", roles: ["TENANT"] },

  // Platform portal
  { href: "/platform", label: "Overview", icon: "dashboard", portal: "platform", roles: ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"] },
  { href: "/platform/organizations", label: "Organizations", icon: "organizations", portal: "platform", roles: ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"] },
  { href: "/platform/mpesa", label: "M-Pesa Webhooks", icon: "mpesa", portal: "platform", roles: ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"] },
  { href: "/platform/jobs", label: "Jobs & Queues", icon: "jobs", portal: "platform", roles: ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"] },
  { href: "/platform/flags", label: "Feature Flags", icon: "featureFlags", portal: "platform", roles: ["PLATFORM_ADMIN"] },
  { href: "/platform/health", label: "System Health", icon: "systemHealth", portal: "platform", roles: ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"] },
  { href: "/platform/audit-logs", label: "Audit Logs", icon: "auditLog", portal: "platform", roles: ["PLATFORM_ADMIN"] },
];

export function navForUser(
  portal: Portal,
  user: { role: Role; subRole: EmployeeSubRole | null },
) {
  return NAV_ITEMS.filter((item) => {
    if (item.portal !== portal) return false;
    if (!item.roles.includes(user.role)) return false;
    if (item.subRoles && (!user.subRole || !item.subRoles.includes(user.subRole))) return false;
    return true;
  });
}
