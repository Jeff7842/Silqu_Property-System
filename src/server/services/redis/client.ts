import { Redis } from "@upstash/redis";

/**
 * Undefined until UPSTASH_REDIS_REST_URL/TOKEN are set (not provisioned
 * yet : Phase 3 only needs the login path to degrade safely without it,
 * not to hard-fail local dev). Every caller must handle the undefined case.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : undefined;
