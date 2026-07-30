import { redirect } from "next/navigation";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { listAuditLogs, listOrganizationsForFilter } from "@/server/db/queries/audit-logs";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExportCsvButton } from "@/components/billing/export-csv-button";

type SearchParams = { orgId?: string; action?: string; from?: string; to?: string };
type LogRow = Awaited<ReturnType<typeof listAuditLogs>>[number];

/** Guards against "Invalid Date" reaching the Prisma query if someone hand-edits the URL. */
function parseDateParam(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);
  // viewPlatformAuditLog: PLATFORM_ADMIN full, PLATFORM_SUPPORT read — both pass, there's no write action on this page.
  if (!hasAccess(user, "viewPlatformAuditLog")) redirect("/platform");

  const params = await searchParams;
  const filters = {
    orgId: params.orgId || undefined,
    action: params.action || undefined,
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
  };

  const [logs, organizations] = await Promise.all([listAuditLogs(filters), listOrganizationsForFilter()]);

  const columns: DataTableColumn<LogRow>[] = [
    {
      key: "createdAt",
      header: "When",
      render: (l) => new Date(l.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" }),
    },
    { key: "org", header: "Organization", render: (l) => l.organization?.name ?? "—" },
    { key: "actor", header: "Actor", render: (l) => l.actorUser?.fullName ?? "System" },
    { key: "action", header: "Action", render: (l) => l.action },
    { key: "entity", header: "Entity", render: (l) => `${l.entityType}${l.entityId ? ` · ${l.entityId}` : ""}` },
  ];

  const exportRows = logs.map((l) => ({
    when: l.createdAt.toISOString(),
    organization: l.organization?.name ?? "",
    actor: l.actorUser?.fullName ?? "System",
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit logs"
        description="Every recorded action across every organization."
        actions={<ExportCsvButton rows={exportRows} filename="audit-logs.csv" />}
      />

      <Card>
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <Select name="orgId" label="Organization" defaultValue={filters.orgId ?? ""}>
            <option value="">All organizations</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
          <Input name="action" label="Action contains" placeholder="e.g. login.failure" defaultValue={params.action ?? ""} />
          <Input type="date" name="from" label="From" defaultValue={params.from ?? ""} />
          <Input type="date" name="to" label="To" defaultValue={params.to ?? ""} />
          <div className="sm:col-span-4">
            <Button type="submit" size="sm">
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      <Card padded={false}>
        <DataTable
          columns={columns}
          rows={logs}
          rowKey={(l) => l.id}
          emptyIcon="auditLog"
          emptyTitle="No audit log entries match these filters"
        />
      </Card>
    </div>
  );
}
