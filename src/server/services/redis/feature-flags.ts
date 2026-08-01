import { redis } from "@/server/services/redis/client";
import { listFeatureFlags, upsertFeatureFlag } from "@/server/db/queries/feature-flags";

const FLAGS_CACHE_KEY = "feature-flags";
// Short TTL, not a long one: this table is admin-managed and low-traffic, so
// staleness isn't a real cost, but keeping it short bounds how long a stale
// read can outlive a write from an admin who forgot to expect a delay.
const CACHE_TTL_SECONDS = 60;

export type FeatureFlag = {
  enabled: boolean;
  /** 0-100. Ignored (treated as if 100) when enabled is false doesn't matter : disabled always loses. */
  rolloutPercent: number;
};

export type FeatureFlags = Record<string, FeatureFlag>;

/**
 * All flags, keyed by flag key.
 * Postgres (the feature_flags table) is the source of truth; Redis is a
 * short-TTL read-through cache in front of it. A Redis flush or missing
 * Redis config never loses a flag : worst case is an extra Postgres read,
 * same no-op-safe pattern as kpi-cache.ts.
 */
export async function getFlags(): Promise<FeatureFlags> {
  if (redis) {
    const cached = await redis.get<FeatureFlags>(FLAGS_CACHE_KEY);
    if (cached) return cached;
  }

  const rows = await listFeatureFlags();
  const flags: FeatureFlags = {};
  for (const row of rows) {
    flags[row.key] = { enabled: row.enabled, rolloutPercent: row.rolloutPercent };
  }

  if (redis) await redis.set(FLAGS_CACHE_KEY, flags, { ex: CACHE_TTL_SECONDS });
  return flags;
}

/**
 * Writes Postgres first (the source of truth), then invalidates the cache by
 * deleting it rather than patching it in place : the next getFlags() call
 * repopulates straight from Postgres, so no reader can ever see a
 * Redis-only value that was never actually persisted.
 */
export async function setFlag(key: string, flag: FeatureFlag, updatedByUserId: string): Promise<void> {
  await upsertFeatureFlag(key, flag.enabled, flag.rolloutPercent, updatedByUserId);
  if (redis) await redis.del(FLAGS_CACHE_KEY);
}

/**
 * Deterministic percentage bucketing: the same user always lands on the same
 * side of a rollout threshold instead of flipping on every request, which is
 * what a naive Math.random() rollout would do.
 */
export function isEnabledForUser(flagKey: string, flag: FeatureFlag, userId: string): boolean {
  if (!flag.enabled) return false;
  if (flag.rolloutPercent >= 100) return true;
  if (flag.rolloutPercent <= 0) return false;
  return hashToBucket(`${flagKey}:${userId}`) < flag.rolloutPercent;
}

/** FNV-1a-style hash folded into a 0-99 bucket : no crypto needed, just needs to be stable and roughly uniform. */
function hashToBucket(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}
