import Link from "next/link";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { SubscriptionPayment } from "@/components/mpesa/subscription-payment";

const STATUS_TONE = { PENDING: "warning", ACTIVE: "success", PAST_DUE: "danger", CANCELLED: "neutral" } as const;

export default async function SettingsPage() {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);

  if (!hasAccess(user, "manageOwnSubscription")) {
    return <ComingSoon title="Settings" icon="settings" phase="a later phase" />;
  }

  const subscription = await db.subscription.findUnique({ where: { orgId } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Your organization's subscription." />

      <Card header={<h3 className="font-semibold text-ink">Subscription</h3>} className="max-w-lg">
        {subscription ? (
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Plan</dt><dd className="text-ink">{subscription.plan === "ANNUAL" ? "Annual" : "Monthly"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Unit limit</dt><dd className="text-ink">{subscription.unitLimit}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Status</dt><dd><Badge tone={STATUS_TONE[subscription.status]}>{subscription.status.replace("_", " ")}</Badge></dd></div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Renews</dt>
                  <dd className="text-ink">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(subscription.currentPeriodEnd)}</dd>
                </div>
              )}
            </dl>
            {subscription.status !== "ACTIVE" && <SubscriptionPayment />}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No subscription found.</p>
        )}
      </Card>

      <Card header={<h3 className="font-semibold text-ink">M-Pesa reconciliation</h3>} className="max-w-lg">
        <p className="mb-3 text-sm text-ink-muted">Review every STK push and manually check any still stuck in progress.</p>
        <Link href="/app/settings/reconciliation"><Button variant="secondary">View reconciliation</Button></Link>
      </Card>
    </div>
  );
}
