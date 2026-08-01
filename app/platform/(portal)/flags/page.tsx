import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { getFlags } from "@/server/services/redis/feature-flags";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeatureFlagForm } from "@/components/flags/feature-flag-form";
import { FeatureFlagRow } from "@/components/flags/feature-flag-row";

export default async function FlagsPage() {
  const session = await auth();
  // toggleFeatureFlag is PLATFORM_ADMIN only per the permission matrix : PLATFORM_SUPPORT has no access at all here.
  requireRole(session, ["PLATFORM_ADMIN"]);

  // Postgres (feature_flags table) is the source of truth, so this page works
  // with or without Redis configured : Redis is only an optional read-through
  // cache in front of it now, no longer a hard requirement to manage flags.
  const flags = await getFlags();
  const entries = Object.entries(flags);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Feature flags" description="Rollout toggles : no code deploy required." />

      <Card header={<h3 className="font-semibold text-ink">Add or update a flag</h3>}>
        <FeatureFlagForm />
      </Card>

      <Card padded={false}>
        {entries.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="featureFlags" title="No flags set yet" />
          </div>
        ) : (
          <div className="divide-y divide-line">
            {entries.map(([key, flag]) => (
              <FeatureFlagRow key={key} flagKey={key} flag={flag} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
