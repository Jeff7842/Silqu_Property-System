import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { getPropertyById } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";
import { updatePropertyAction } from "@/server/actions/property.actions";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "createEditProperty")) redirect("/app/properties");
  const orgId = requireOrg(session);
  const { id } = await params;

  const property = await getPropertyById(orgId, id);
  if (!property) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${property.name}`} />
      <Card className="max-w-xl">
        <PropertyForm
          action={updatePropertyAction.bind(null, id)}
          redirectTo={`/app/properties/${id}`}
          defaults={property}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
