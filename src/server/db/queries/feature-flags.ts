import { db } from "@/server/db/client";

/** Platform flags page : every flag, most-recently-updated first. Table is small (admin-managed), no pagination needed. */
export function listFeatureFlags() {
  return db.featureFlag.findMany({ orderBy: { updatedAt: "desc" }, take: 500 });
}

/** Single flag lookup for the read-through cache in services/redis/feature-flags.ts. Null when the key has never been set. */
export function getFeatureFlag(key: string) {
  return db.featureFlag.findUnique({ where: { key } });
}

/** Upserts by key : Postgres is the source of truth; the caller invalidates the Redis cache after this resolves. */
export function upsertFeatureFlag(key: string, enabled: boolean, rolloutPercent: number, updatedByUserId: string) {
  return db.featureFlag.upsert({
    where: { key },
    create: { key, enabled, rolloutPercent, updatedByUserId },
    update: { enabled, rolloutPercent, updatedByUserId },
  });
}
