"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { upsertFeatureFlagAction } from "@/server/actions/feature-flag.actions";

export function FeatureFlagForm() {
  const [state, formAction, pending] = useActionState(upsertFeatureFlagAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Input name="key" label="Flag key" placeholder="e.g. new-invoice-ui" required className="sm:w-56" />
      <Input
        name="rolloutPercent"
        label="Rollout %"
        type="number"
        min={0}
        max={100}
        defaultValue={100}
        required
        className="sm:w-28"
      />
      <Switch name="enabled" label="Enabled" defaultChecked />
      <Button type="submit" loading={pending}>
        Save flag
      </Button>
      {state?.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
