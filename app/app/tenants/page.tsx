import Link from "next/link";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { listTenants } from "@/server/db/queries/tenants";
import { listPendingInvitations } from "@/server/db/queries/invitations";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/phone";
import { InvitationRow } from "@/components/tenants/invitation-row";

const STATUS_TONE = { ACTIVE: "success", ARCHIVED: "neutral" } as const;

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);
  const { q } = await searchParams;

  const canManage = hasAccess(user, "onboardTenant");
  const [tenants, invitations] = await Promise.all([
    listTenants(orgId, { search: q }),
    canManage ? listPendingInvitations(orgId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tenants"
        description="Everyone leasing a unit in your portfolio."
        actions={canManage && <Link href="/app/tenants/new"><Button>Add tenant</Button></Link>}
      />

      <form className="max-w-md" method="get">
        <Input name="q" placeholder="Search by name or phone" defaultValue={q} icon="search" />
      </form>

      {tenants.length === 0 ? (
        <Card>
          <EmptyState
            icon="tenants"
            title="No tenants yet"
            description={canManage ? "Add your first tenant to start leasing units." : undefined}
            action={canManage && <Link href="/app/tenants/new"><Button>Add tenant</Button></Link>}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-line">
            {tenants.map((t) => {
              const lease = t.leases[0];
              return (
                <Link key={t.id} href={`/app/tenants/${t.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-canvas">
                  <div>
                    <p className="font-medium text-ink">{t.fullName}</p>
                    <p className="text-xs text-ink-muted">
                      {formatPhone(t.phone)} {lease ? `: ${lease.unit.label}` : ""}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {canManage && (
        <Card header={<h3 className="font-semibold text-ink">Pending invitations</h3>}>
          {invitations.length === 0 ? (
            <p className="text-sm text-ink-muted">No pending invitations.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {invitations.map((inv) => (
                <InvitationRow key={inv.id} invitation={inv} />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
