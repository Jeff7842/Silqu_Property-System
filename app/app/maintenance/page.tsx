import Link from "next/link";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { listMaintenanceRequests, listMaintenanceForCaretaker } from "@/server/db/queries/maintenance";
import { listProperties } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUS_TONE = { OPEN: "danger", ASSIGNED: "warning", IN_PROGRESS: "warning", RESOLVED: "success", CLOSED: "neutral" } as const;
const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger", URGENT: "danger" } as const;

export default async function MaintenanceQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; status?: string; priority?: string }>;
}) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);
  const { propertyId, status, priority } = await searchParams;

  const isCaretaker = user.role === "CARETAKER";
  const [requests, properties] = await Promise.all([
    isCaretaker
      ? listMaintenanceForCaretaker(orgId, user.id)
      : listMaintenanceRequests(orgId, {
          propertyId: propertyId || undefined,
          status: (["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).includes(status as never) ? (status as never) : undefined,
          priority: (["LOW", "MEDIUM", "HIGH", "URGENT"] as const).includes(priority as never) ? (priority as never) : undefined,
        }),
    isCaretaker ? Promise.resolve([]) : listProperties(orgId, { status: "ACTIVE" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Maintenance" description={isCaretaker ? "Requests on your assigned units." : "Every request across your portfolio."} />

      {!isCaretaker && (
        <form className="flex flex-wrap items-end gap-3" method="get">
          <Select name="propertyId" label="Property" defaultValue={propertyId ?? ""} className="w-56">
            <option value="">All properties</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select name="status" label="Status" defaultValue={status ?? ""} className="w-40">
            <option value="">All statuses</option>
            {["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </Select>
          <Select name="priority" label="Priority" defaultValue={priority ?? ""} className="w-40">
            <option value="">All priorities</option>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      )}

      <Card padded={false}>
        <DataTable
          rows={requests}
          rowKey={(r) => r.id}
          emptyIcon="maintenance"
          emptyTitle="No requests"
          columns={[
            { key: "unit", header: "Unit", render: (r) => <Link href={`/app/maintenance/${r.id}`} className="font-medium text-primary hover:underline">{r.unit.property.name} — {r.unit.label}</Link> },
            { key: "category", header: "Category", render: (r) => r.category.replace("_", " ") },
            { key: "tenant", header: "Tenant", render: (r) => r.tenant?.fullName ?? "—" },
            { key: "priority", header: "Priority", render: (r) => <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority}</Badge> },
            { key: "assigned", header: "Assigned to", render: (r) => r.assignedTo?.fullName ?? "—" },
            { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status.replace("_", " ")}</Badge> },
            { key: "age", header: "Raised", render: (r) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(r.createdAt) },
          ]}
        />
      </Card>
    </div>
  );
}
