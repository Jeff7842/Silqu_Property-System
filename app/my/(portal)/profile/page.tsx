import { auth } from "@/server/auth/tenant";
import { requireOrg, requireRole } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { formatPhone } from "@/lib/phone";
import { ChangePasswordForm } from "@/components/tenant/change-password-form";

export default async function TenantProfilePage() {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);
  const orgId = requireOrg(session);

  // Same inline own-record lookup pattern as app/my/(portal)/payments/page.tsx :
  // a single-row, session-scoped read that isn't worth a dedicated query module.
  const tenant = await db.tenant.findFirst({
    where: { orgId, userId: user.id },
    select: { fullName: true, phone: true, email: true, nationalId: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile" description="Your account details and password." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card header={<h3 className="font-semibold text-ink">Your details</h3>}>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Full name</dt>
              <dd className="text-ink">{tenant?.fullName ?? user.fullName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Email</dt>
              <dd className="text-ink">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Phone</dt>
              <dd className="text-ink">{tenant?.phone ? formatPhone(tenant.phone) : ":"}</dd>
            </div>
            {tenant?.nationalId && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">National ID</dt>
                <dd className="text-ink">{tenant.nationalId}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card header={<h3 className="font-semibold text-ink">Change password</h3>}>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
