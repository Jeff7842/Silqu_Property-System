import { notFound, forbidden } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { can } from "@/server/auth/permissions";
import { getMaintenanceRequestById, getMaintenanceRequestForCaretaker } from "@/server/db/queries/maintenance";
import { listCaretakers } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/maintenance/status-timeline";
import { StatusActions } from "@/components/maintenance/status-actions";
import { AssignForm } from "@/components/maintenance/assign-form";
import { CommentThread } from "@/components/maintenance/comment-thread";
import { NEXT_MAINTENANCE_STATUS } from "@/lib/maintenance";

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger", URGENT: "danger" } as const;

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);
  const { id } = await params;

  const access = can(user, "resolveMaintenanceRequest");
  const request = access === "scoped"
    ? await getMaintenanceRequestForCaretaker(orgId, id, user.id)
    : await getMaintenanceRequestById(orgId, id);

  if (access === "scoped" && !request) {
    const exists = await getMaintenanceRequestById(orgId, id);
    if (exists) forbidden();
  }
  if (!request) notFound();

  const canManage = access === "full" || access === "scoped";
  const caretakers = access === "full" ? await listCaretakers(orgId) : [];
  const nextStatuses = canManage ? NEXT_MAINTENANCE_STATUS[request.status].filter((s) => s !== "CLOSED" || user.role === "MANAGER") : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${request.unit.property.name} — ${request.unit.label}`}
        description={request.category.replace("_", " ")}
        actions={<Badge tone={PRIORITY_TONE[request.priority]}>{request.priority}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">Details</h3>}>
            <p className="text-sm text-ink">{request.description}</p>
            <p className="mt-2 text-xs text-ink-muted">Raised by {request.tenant?.fullName ?? "—"} on {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(request.createdAt)}</p>
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Comments</h3>}>
            <CommentThread requestId={id} comments={request.comments} currentUserId={user.id} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card header={<h3 className="font-semibold text-ink">Status</h3>}>
            <StatusTimeline status={request.status} />
            {canManage && <StatusActions requestId={id} options={nextStatuses} />}
          </Card>

          {access === "full" && (
            <Card header={<h3 className="font-semibold text-ink">Assignment</h3>}>
              {request.assignedTo ? (
                <p className="text-sm text-ink">Assigned to <span className="font-medium">{request.assignedTo.fullName}</span></p>
              ) : (
                <p className="mb-3 text-sm text-ink-muted">Not yet assigned.</p>
              )}
              <div className="mt-3">
                <AssignForm requestId={id} caretakers={caretakers} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
