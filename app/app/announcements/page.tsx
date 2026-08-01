import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { listAnnouncements, listPropertiesWithUnitsForCompose } from "@/server/db/queries/announcements";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ComposeDrawer } from "@/components/announcements/compose-drawer";

const AUDIENCE_LABEL = { ALL: "All tenants", PROPERTY: "Property", UNIT: "Unit" } as const;

export default async function AnnouncementsPage() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);
  const canPublish = hasAccess(user, "publishAnnouncement");

  const [announcements, properties] = await Promise.all([
    listAnnouncements(orgId),
    canPublish ? listPropertiesWithUnitsForCompose(orgId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        description="Publish updates to your tenants."
        actions={canPublish && <ComposeDrawer properties={properties} />}
      />

      <Card header={<h3 className="font-semibold text-ink">Published</h3>}>
        {announcements.length === 0 ? (
          <EmptyState icon="announcements" title="No announcements yet" />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  <p className="mt-1 text-sm text-ink-muted">{a.body}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    By {a.createdBy.fullName} · {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(a.createdAt)}
                  </p>
                </div>
                <Badge tone="neutral">
                  {AUDIENCE_LABEL[a.audience]}
                  {a.property ? `: ${a.property.name}` : ""}
                  {a.unit ? `: ${a.unit.label}` : ""}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
