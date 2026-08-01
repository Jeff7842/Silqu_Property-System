import Link from "next/link";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { listAllOrganizations } from "@/server/db/queries/organizations";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ToggleOrgStatusButton } from "@/components/organizations/toggle-org-status-button";
import type { OrganizationStatus, SubscriptionPlan } from "@/generated/prisma/client";

const STATUS_TONE: Record<OrganizationStatus, "success" | "danger" | "neutral"> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  ARCHIVED: "neutral",
};

const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
};

type OrgRow = Awaited<ReturnType<typeof listAllOrganizations>>[number];

export default async function OrganizationsPage() {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);
  const organizations = await listAllOrganizations();

  const columns: DataTableColumn<OrgRow>[] = [
    {
      key: "name",
      header: "Organization",
      render: (o) => (
        <div>
          <Link href={`/platform/organizations/${o.id}`} className="font-medium text-ink hover:text-primary">
            {o.name}
          </Link>
          <p className="text-xs text-ink-muted">{o.county}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (o) => (o.subscription ? PLAN_LABEL[o.subscription.plan] : ":"),
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>,
    },
    {
      key: "joined",
      header: "Joined",
      render: (o) => new Date(o.createdAt).toLocaleDateString("en-KE"),
    },
  ];

  // Suspend/reactivate is PLATFORM_ADMIN only per the permission matrix
  // (suspendOrganization) : PLATFORM_SUPPORT gets the same list without the control.
  if (user.role === "PLATFORM_ADMIN") {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      render: (o) => <ToggleOrgStatusButton orgId={o.id} status={o.status} />,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Organizations" description="Every landlord and property manager account on SILQU." />

      <Card padded={false}>
        <DataTable
          columns={columns}
          rows={organizations}
          rowKey={(o) => o.id}
          emptyIcon="organizations"
          emptyTitle="No organizations yet"
        />
      </Card>

      {user.role === "PLATFORM_ADMIN" && (
        <p className="text-xs text-ink-muted">
          Suspending an organization is recorded in the audit log and immediately blocks sign-in for every user in
          it, across all three portals.
        </p>
      )}
    </div>
  );
}
