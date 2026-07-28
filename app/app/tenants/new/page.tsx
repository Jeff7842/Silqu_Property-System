import { redirect } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { TenantForm } from "@/components/tenants/tenant-form";
import { createTenantAction } from "@/server/actions/tenant.actions";

export default async function NewTenantPage() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "onboardTenant")) redirect("/app/tenants");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add tenant" description="Record a new tenant. You can lease them a unit next." />
      <Card className="max-w-xl">
        <TenantForm action={createTenantAction} redirectTo="/app/tenants" submitLabel="Create tenant" />
      </Card>
    </div>
  );
}
