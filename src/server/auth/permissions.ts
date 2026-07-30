import type { Role, EmployeeSubRole } from "@/generated/prisma/client";

/** One column of the build plan section 6.2 permission matrix. */
export type Actor = "PLAT_ADMIN" | "PLAT_SUPPORT" | "MANAGER" | "EMP_FINANCE" | "EMP_CARE" | "EMP_OWNER" | "CARETAKER" | "TENANT";

export function actorFor(user: { role: Role; subRole: EmployeeSubRole | null }): Actor {
  if (user.role === "EMPLOYEE") {
    if (user.subRole === "FINANCE") return "EMP_FINANCE";
    if (user.subRole === "CUSTOMER_CARE") return "EMP_CARE";
    return "EMP_OWNER";
  }
  return {
    PLATFORM_ADMIN: "PLAT_ADMIN",
    PLATFORM_SUPPORT: "PLAT_SUPPORT",
    MANAGER: "MANAGER",
    CARETAKER: "CARETAKER",
    TENANT: "TENANT",
  }[user.role] as Actor;
}

/** "full" and "read"/"scoped" all mean "may attempt this" — the query layer applies the actual row-level scope. Only "none" is a hard no. */
export type Access = "full" | "read" | "scoped" | "none";

export type Capability =
  | "viewOwnDashboard"
  | "createEditProperty"
  | "viewProperties"
  | "createEditUnit"
  | "updateUnitStatus"
  | "onboardTenant"
  | "viewTenantRecords"
  | "createEndLease"
  | "generateInvoices"
  | "recordPayment"
  | "sendArrearsReminder"
  | "viewOwnInvoicesPayments"
  | "payRentMpesa"
  | "viewArrearsReport"
  | "raiseMaintenanceRequest"
  | "resolveMaintenanceRequest"
  | "closeMaintenanceRequest"
  | "publishAnnouncement"
  | "inviteManageStaff"
  | "manageOwnSubscription"
  | "viewOwnOrgAuditLog"
  | "suspendOrganization"
  | "viewPlatformAuditLog"
  | "replayQueueJob"
  | "toggleFeatureFlag"
  | "startSupportSession";

const N: Access = "none";
const F: Access = "full";
const R: Access = "read";
const S: Access = "scoped";

// Transcribed from docs/SILQU_BUILD_PLAN_V2.md section 6.2. Columns:
// [PLAT_ADMIN, PLAT_SUPPORT, MANAGER, EMP_FINANCE, EMP_CARE, EMP_OWNER, CARETAKER, TENANT]
const MATRIX: Record<Capability, Record<Actor, Access>> = {
  viewOwnDashboard:      { PLAT_ADMIN: F, PLAT_SUPPORT: F, MANAGER: F, EMP_FINANCE: F, EMP_CARE: F, EMP_OWNER: F, CARETAKER: S, TENANT: S },
  createEditProperty:    { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  viewProperties:        { PLAT_ADMIN: R, PLAT_SUPPORT: S, MANAGER: F, EMP_FINANCE: R, EMP_CARE: R, EMP_OWNER: F, CARETAKER: S, TENANT: N },
  createEditUnit:        { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  updateUnitStatus:      { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: F, CARETAKER: S, TENANT: N },
  onboardTenant:         { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: F, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  viewTenantRecords:     { PLAT_ADMIN: R, PLAT_SUPPORT: S, MANAGER: F, EMP_FINANCE: R, EMP_CARE: F, EMP_OWNER: F, CARETAKER: S, TENANT: N },
  createEndLease:        { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  generateInvoices:      { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: F, EMP_CARE: N, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  recordPayment:         { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: F, EMP_CARE: N, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  sendArrearsReminder:   { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: F, EMP_CARE: N, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  viewOwnInvoicesPayments: { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: N, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: S },
  payRentMpesa:          { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: N, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: S },
  viewArrearsReport:     { PLAT_ADMIN: R, PLAT_SUPPORT: R, MANAGER: F, EMP_FINANCE: F, EMP_CARE: R, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  raiseMaintenanceRequest: { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: F, EMP_OWNER: F, CARETAKER: S, TENANT: S },
  resolveMaintenanceRequest: { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: F, EMP_OWNER: F, CARETAKER: S, TENANT: N },
  closeMaintenanceRequest: { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: F, CARETAKER: N, TENANT: S },
  publishAnnouncement:   { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: F, EMP_OWNER: F, CARETAKER: N, TENANT: N },
  inviteManageStaff:     { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: N },
  manageOwnSubscription: { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: N },
  viewOwnOrgAuditLog:    { PLAT_ADMIN: N, PLAT_SUPPORT: N, MANAGER: F, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: R, CARETAKER: N, TENANT: N },
  suspendOrganization:   { PLAT_ADMIN: F, PLAT_SUPPORT: N, MANAGER: N, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: N },
  viewPlatformAuditLog:  { PLAT_ADMIN: F, PLAT_SUPPORT: R, MANAGER: N, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: N },
  replayQueueJob:        { PLAT_ADMIN: F, PLAT_SUPPORT: N, MANAGER: N, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: N },
  toggleFeatureFlag:     { PLAT_ADMIN: F, PLAT_SUPPORT: N, MANAGER: N, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: N },
  startSupportSession:   { PLAT_ADMIN: F, PLAT_SUPPORT: F, MANAGER: N, EMP_FINANCE: N, EMP_CARE: N, EMP_OWNER: N, CARETAKER: N, TENANT: N },
};

export function can(
  user: { role: Role; subRole: EmployeeSubRole | null },
  capability: Capability,
): Access {
  return MATRIX[capability][actorFor(user)];
}

export function hasAccess(user: { role: Role; subRole: EmployeeSubRole | null }, capability: Capability): boolean {
  return can(user, capability) !== "none";
}
