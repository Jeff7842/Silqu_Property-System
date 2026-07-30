"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleFeatureFlagAction } from "@/server/actions/feature-flag.actions";
import type { FeatureFlag } from "@/server/services/redis/feature-flags";

export function FeatureFlagRow({ flagKey, flag }: { flagKey: string; flag: FeatureFlag }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div>
        <p className="font-mono text-sm text-ink">{flagKey}</p>
        <p className="text-xs text-ink-muted">{flag.rolloutPercent}% rollout</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={flag.enabled ? "success" : "neutral"}>{flag.enabled ? "Enabled" : "Disabled"}</Badge>
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await toggleFeatureFlagAction(flagKey, !flag.enabled, flag.rolloutPercent);
              router.refresh();
            })
          }
        >
          {flag.enabled ? "Disable" : "Enable"}
        </Button>
      </div>
    </div>
  );
}
