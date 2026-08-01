import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { getPropertyById } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { UnitForm } from "@/components/properties/unit-form";
import { BulkUnitForm } from "@/components/properties/bulk-unit-form";

export default async function NewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "createEditUnit")) redirect("/app/properties");
  const orgId = requireOrg(session);
  const { id } = await params;

  const property = await getPropertyById(orgId, id);
  if (!property) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Add units : ${property.name}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card header={<h3 className="font-semibold text-ink">Single unit</h3>}>
          <UnitForm propertyId={id} />
        </Card>
        <Card header={<h3 className="font-semibold text-ink">Bulk create</h3>}>
          <BulkUnitForm propertyId={id} />
        </Card>
      </div>
    </div>
  );
}
