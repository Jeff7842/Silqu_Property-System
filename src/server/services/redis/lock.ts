import { redis } from "@/server/services/redis/client";

/** SET key value NX EX seconds : "only if nobody else has it". No-op-safe (always "acquired") until Redis is configured. */
export async function acquireLock(key: string, ttlSeconds = 300): Promise<boolean> {
  if (!redis) return true;
  const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
  return result === "OK";
}

export async function releaseLock(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(key);
}
