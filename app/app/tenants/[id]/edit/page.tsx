import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { getTenantById } from "@/server/db/queries/tenants";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { TenantForm } from "@/components/tenants/tenant-form";
import { updateTenantAction } from "@/server/actions/tenant.actions";

export default async function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "onboardTenant")) redirect("/app/tenants");
  const orgId = requireOrg(session);
  const { id } = await params;

  const tenant = await getTenantById(orgId, id);
  if (!tenant) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${tenant.fullName}`} />
      <Card className="max-w-xl">
        <TenantForm
          action={updateTenantAction.bind(null, id)}
          redirectTo={`/app/tenants/${id}`}
          defaults={tenant}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
