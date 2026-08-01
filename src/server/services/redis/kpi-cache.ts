import { redis } from "@/server/services/redis/client";

const TTL_SECONDS = 60;

/** Reads/writes are no-ops until Redis is configured : dashboards just always hit the DB. */
export async function getCachedKpis<T>(orgId: string, key: string): Promise<T | null> {
  if (!redis) return null;
  return (await redis.get<T>(`kpi:${orgId}:${key}`)) ?? null;
}

export async function setCachedKpis<T>(orgId: string, key: string, value: T): Promise<void> {
  if (!redis) return;
  await redis.set(`kpi:${orgId}:${key}`, value, { ex: TTL_SECONDS });
}

/** Call from invoice/payment write paths so a fresh payment shows up immediately. */
export async function bustKpiCache(orgId: string): Promise<void> {
  if (!redis) return;
  const keys = await redis.keys(`kpi:${orgId}:*`);
  if (keys.length) await redis.del(...keys);
}
