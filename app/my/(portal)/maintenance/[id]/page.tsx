import { notFound } from "next/navigation";
import { auth } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { getMaintenanceRequestForTenant } from "@/server/db/queries/maintenance";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/maintenance/status-timeline";
import { StatusActions } from "@/components/maintenance/status-actions";
import { CommentThread } from "@/components/maintenance/comment-thread";

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger", URGENT: "danger" } as const;

export default async function TenantMaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);
  const { id } = await params;

  const tenant = await db.tenant.findFirst({ where: { orgId, userId: user.id } });
  const request = tenant ? await getMaintenanceRequestForTenant(orgId, id, tenant.id) : null;
  if (!request) notFound();

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
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Comments</h3>}>
            <CommentThread requestId={id} comments={request.comments} currentUserId={user.id} />
          </Card>
        </div>

        <Card header={<h3 className="font-semibold text-ink">Status</h3>}>
          <StatusTimeline status={request.status} />
          {request.status === "RESOLVED" && (
            <div className="mt-2">
              <p className="mb-2 text-xs text-ink-muted">Is this fixed? Confirm to close the request.</p>
              <StatusActions requestId={id} options={["CLOSED"]} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
