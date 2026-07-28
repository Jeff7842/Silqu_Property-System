import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/server/services/redis/client";

const loginLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "rl:login" })
  : undefined;

const resetLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "15 m"), prefix: "rl:reset" })
  : undefined;

const stkPushLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "5 m"), prefix: "rl:stk" })
  : undefined;

/** Returns true when the request should be BLOCKED. No-ops (never blocks) until Redis is configured. */
export async function isLoginRateLimited(email: string, ip: string) {
  if (!loginLimiter) return false;
  const { success } = await loginLimiter.limit(`${email}:${ip}`);
  return !success;
}

export async function isPasswordResetRateLimited(email: string) {
  if (!resetLimiter) return false;
  const { success } = await resetLimiter.limit(email);
  return !success;
}

export async function isStkPushRateLimited(phone: string) {
  if (!stkPushLimiter) return false;
  const { success } = await stkPushLimiter.limit(phone);
  return !success;
}
