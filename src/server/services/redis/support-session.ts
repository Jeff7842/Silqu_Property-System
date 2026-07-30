import { redis } from "@/server/services/redis/client";

// A platform staffer viewing one org's detail page is scoped, time-boxed and
// audited — this is that scope's TTL, not a general "how long until logout" value.
const TTL_SECONDS = 30 * 60; // 30 minutes

export type SupportSession = { reason: string; startedAt: string };

function sessionKey(platformUserId: string, orgId: string): string {
  return `support-session:${platformUserId}:${orgId}`;
}

/**
 * Reads the live support session for this (staffer, org) pair, or null if
 * none exists / it expired. No-op-safe: always null until Redis is
 * configured, which means the org-detail page always shows the "give a
 * reason" form in that case — the gate degrades to "ask every time" rather
 * than "let everyone through", since this guards visibility into another
 * org's tenant/financial data.
 */
export async function getSupportSession(platformUserId: string, orgId: string): Promise<SupportSession | null> {
  if (!redis) return null;
  return (await redis.get<SupportSession>(sessionKey(platformUserId, orgId))) ?? null;
}

/** Starts (or restarts) a support session. Caller is responsible for writing the AuditLog row. */
export async function startSupportSession(platformUserId: string, orgId: string, reason: string): Promise<void> {
  if (!redis) return;
  const session: SupportSession = { reason, startedAt: new Date().toISOString() };
  await redis.set(sessionKey(platformUserId, orgId), session, { ex: TTL_SECONDS });
}
