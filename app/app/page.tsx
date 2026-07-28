import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { ManagerDashboard } from "@/app/app/_dashboards/manager-dashboard";
import { FinanceDashboard } from "@/app/app/_dashboards/finance-dashboard";
import { CareDashboard } from "@/app/app/_dashboards/care-dashboard";
import { CaretakerDashboard } from "@/app/app/_dashboards/caretaker-dashboard";

export default async function BusinessHome() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);

  if (user.role === "CARETAKER") {
    return <CaretakerDashboard orgId={orgId} userId={user.id} fullName={user.fullName} />;
  }

  if (user.role === "EMPLOYEE" && user.subRole === "FINANCE") {
    return <FinanceDashboard orgId={orgId} fullName={user.fullName} />;
  }

  if (user.role === "EMPLOYEE" && user.subRole === "CUSTOMER_CARE") {
    return <CareDashboard orgId={orgId} fullName={user.fullName} />;
  }

  return <ManagerDashboard orgId={orgId} fullName={user.fullName} />;
}
