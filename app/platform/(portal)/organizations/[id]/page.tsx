import { notFound } from "next/navigation";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { getOrganizationById } from "@/server/db/queries/organizations";
import { getSupportSession } from "@/server/services/redis/support-session";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartSupportSessionForm } from "@/components/organizations/start-support-session-form";
import type { OrganizationStatus } from "@/generated/prisma/client";

const STATUS_TONE: Record<OrganizationStatus, "success" | "danger" | "neutral"> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  ARCHIVED: "neutral",
};

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);
  const { id } = await params;

  const org = await getOrganizationById(id);
  if (!org) notFound();

  // Read-only visibility into one org from the platform portal : gated by
  // startSupportSession, not by the broader viewOrganizations-style access
  // every platform user already has for the list page.
  if (!hasAccess(user, "startSupportSession")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={org.name} />
        <Card>
          <p className="text-sm text-ink-muted">You don&apos;t have permission to view organization detail.</p>
        </Card>
      </div>
    );
  }

  const activeSession = await getSupportSession(user.id, id);

  if (!activeSession) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={org.name}
          description="Starting a support session records why you're viewing this organization's data."
        />
        <Card>
          <StartSupportSessionForm orgId={id} />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={org.name} description={`Support session active : reason: "${activeSession.reason}"`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-ink-muted">Status</p>
          <Badge tone={STATUS_TONE[org.status]}>{org.status}</Badge>
        </Card>
        <Card>
          <p className="text-xs text-ink-muted">Plan</p>
          <p className="text-sm text-ink">{org.subscription?.plan ?? ":"}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-muted">County</p>
          <p className="text-sm text-ink">{org.county}</p>
        </Card>
      </div>

      <Card header={<h3 className="font-semibold text-ink">Overview</h3>}>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Phone</dt>
            <dd className="text-ink">{org.phone}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Email</dt>
            <dd className="text-ink">{org.email}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Properties</dt>
            <dd className="text-ink">{org._count.properties}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Tenants</dt>
            <dd className="text-ink">{org._count.tenants}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Staff</dt>
            <dd className="text-ink">{org._count.users}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Joined</dt>
            <dd className="text-ink">{new Date(org.createdAt).toLocaleDateString("en-KE")}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
