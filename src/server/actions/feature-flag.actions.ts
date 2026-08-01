"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { logAudit } from "@/server/services/audit";
import { getFlags, setFlag, type FeatureFlag } from "@/server/services/redis/feature-flags";

export type ActionState = { error?: string; success?: boolean } | undefined;

// e.g. "new-invoice-ui" : restrictive on purpose so a typo'd key can't collide with something unrelated in the hash.
const KEY_PATTERN = /^[a-z0-9][a-z0-9-_]{1,63}$/i;

async function writeFlag(actorUserId: string, key: string, flag: FeatureFlag) {
  const before = (await getFlags())[key];
  await setFlag(key, flag, actorUserId);
  logAudit({ actorUserId, action: "feature_flag.updated", entityType: "FeatureFlag", entityId: key, before, after: flag });
  revalidatePath("/platform/flags");
}

/** Add-or-update form on the flags page : validates the typed key/percent before writing. */
export async function upsertFeatureFlagAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN"]);

  const key = String(formData.get("key") ?? "").trim();
  const enabled = formData.get("enabled") === "on";
  const rolloutPercent = Number(formData.get("rolloutPercent") ?? 0);

  if (!KEY_PATTERN.test(key)) return { error: "Flag key must be 2-64 characters: letters, numbers, - and _." };
  if (!Number.isFinite(rolloutPercent) || rolloutPercent < 0 || rolloutPercent > 100) {
    return { error: "Rollout percent must be a number between 0 and 100." };
  }

  await writeFlag(user.id, key, { enabled, rolloutPercent });
  return { success: true };
}

/** Quick enable/disable from the flag list row : keeps the existing rollout percent. */
export async function toggleFeatureFlagAction(key: string, enabled: boolean, rolloutPercent: number): Promise<ActionState> {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN"]);

  await writeFlag(user.id, key, { enabled, rolloutPercent });
  return { success: true };
}
