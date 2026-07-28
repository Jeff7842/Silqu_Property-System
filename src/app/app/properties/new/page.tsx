import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";
import { createPropertyAction } from "@/server/actions/property.actions";

export default async function NewPropertyPage() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "createEditProperty")) redirect("/app/properties");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add property" description="Create a new property in your portfolio." />
      <Card className="max-w-xl">
        <PropertyForm action={createPropertyAction} redirectTo="/app/properties" submitLabel="Create property" />
      </Card>
    </div>
  );
}
