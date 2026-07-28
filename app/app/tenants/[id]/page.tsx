import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { getTenantById, getTenantLedger } from "@/server/db/queries/tenants";
import { listVacantUnits } from "@/server/db/queries/properties";
import { listTenantDocuments } from "@/server/db/queries/documents";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatPhone } from "@/lib/phone";
import { LeaseForm } from "@/components/tenants/lease-form";
import { LeaseActions } from "@/components/tenants/lease-actions";
import { SendInviteButton, ArchiveTenantButton } from "@/components/tenants/tenant-actions";
import { DocumentUpload } from "@/components/tenants/document-upload";

const LEASE_TONE = { PENDING: "warning", ACTIVE: "success", ENDED: "neutral", TERMINATED: "danger" } as const;

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  const orgId = requireOrg(session);
  const { id } = await params;

  const tenant = await getTenantById(orgId, id);
  if (!tenant) notFound();

  const canManage = hasAccess(user, "onboardTenant");
  const currentLease = tenant.leases.find((l) => l.status === "ACTIVE" || l.status === "PENDING");
  const pendingInvite = tenant.invitations[0] && !tenant.invitations[0].acceptedAt ? tenant.invitations[0] : null;

  const [vacantUnits, ledger, documents] = await Promise.all([
    canManage && !currentLease ? listVacantUnits(orgId) : Promise.resolve([]),
    getTenantLedger(orgId, id),
    listTenantDocuments(orgId, id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tenant.fullName}
        description={formatPhone(tenant.phone)}
        actions={
          canManage && (
            <>
              <Link href={`/app/tenants/${id}/edit`}><Button variant="secondary">Edit</Button></Link>
              {!tenant.userId && !pendingInvite && tenant.email && <SendInviteButton tenantId={id} />}
              {tenant.status === "ACTIVE" && <ArchiveTenantButton tenantId={id} />}
            </>
          )
        }
      />

      {canManage && tenant.email && (
        <p className="text-sm text-ink-muted">
          {tenant.userId ? (
            <span className="inline-flex items-center gap-1 text-success"><Icon name="success" size={16} />Portal account active</span>
          ) : pendingInvite ? (
            <span>Invitation sent to {tenant.email}, expires {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(pendingInvite.expiresAt)}.</span>
          ) : (
            <span>No portal account yet.</span>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card header={<h3 className="font-semibold text-ink">Lease</h3>}>
            {currentLease ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{currentLease.unit.property.name} — {currentLease.unit.label}</p>
                    <p className="text-sm text-ink-muted">
                      {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(currentLease.startDate)} –{" "}
                      {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(currentLease.endDate)}
                    </p>
                  </div>
                  <Badge tone={LEASE_TONE[currentLease.status]}>{currentLease.status}</Badge>
                </div>
                <Money cents={currentLease.rentCents} size="small" />
                {canManage && <LeaseActions leaseId={currentLease.id} status={currentLease.status} />}
              </div>
            ) : canManage ? (
              <LeaseForm tenantId={id} units={vacantUnits} />
            ) : (
              <EmptyState icon="leases" title="No active lease" />
            )}
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Ledger</h3>} padded={false}>
            {ledger.length === 0 ? (
              <div className="p-5"><EmptyState icon="emptyMoney" title="No transactions yet" /></div>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {ledger.map((e) => (
                  <div key={`${e.type}-${e.id}`} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{e.label}</p>
                      <p className="text-xs text-ink-muted">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(e.date)}</p>
                    </div>
                    <div className="text-right">
                      <Money cents={e.amountCents} tone={e.amountCents < 0 ? "positive" : "default"} size="small" />
                      <p className="text-xs text-ink-muted">Bal: <Money cents={e.runningBalance} size="small" showCurrency={false} /></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Requests</h3>}>
            {tenant.maintenanceRequests.length === 0 ? (
              <p className="text-sm text-ink-muted">No maintenance requests.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {tenant.maintenanceRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink">{r.category.replace("_", " ")}</span>
                    <Badge tone="neutral">{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card header={<h3 className="font-semibold text-ink">Details</h3>}>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">National ID</dt><dd className="text-ink">{tenant.nationalId}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Email</dt><dd className="text-ink">{tenant.email ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Next of kin</dt><dd className="text-ink">{tenant.nextOfKinName ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Status</dt><dd><Badge tone={tenant.status === "ACTIVE" ? "success" : "neutral"}>{tenant.status}</Badge></dd></div>
            </dl>
          </Card>

          <Card header={<h3 className="font-semibold text-ink">Documents</h3>}>
            <div className="flex flex-col gap-3">
              {documents.length === 0 ? (
                <p className="text-sm text-ink-muted">No documents uploaded.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {documents.map((d) => (
                    <li key={d.id}>
                      <a href={`/api/documents/${d.id}/download`} className="inline-flex items-center gap-2 text-primary hover:underline">
                        <Icon name="document" size={16} />
                        {d.kind.replace("_", " ")}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {canManage && <DocumentUpload tenantId={id} />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
