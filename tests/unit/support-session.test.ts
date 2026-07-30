import { describe, expect, it } from "vitest";
import { getSupportSession, startSupportSession } from "@/server/services/redis/support-session";
import { redis } from "@/server/services/redis/client";

// This environment has no UPSTASH_REDIS_REST_URL/TOKEN configured (same as
// dev — see vitest.setup.ts, which only loads .env.local), so `redis` is
// undefined here. These tests lock in the no-op-safe fallback: without
// Redis, the gate degrades to "always ask for a reason" rather than
// crashing or silently granting access.
describe("support-session (no-op-safe path, Redis not configured)", () => {
  it("confirms this test run has no Redis configured", () => {
    expect(redis).toBeUndefined();
  });

  it("getSupportSession returns null instead of throwing", async () => {
    await expect(getSupportSession("platform-user-1", "org-1")).resolves.toBeNull();
  });

  it("startSupportSession resolves without throwing, and the session still isn't readable afterwards", async () => {
    await expect(startSupportSession("platform-user-1", "org-1", "Investigating ticket #123")).resolves.toBeUndefined();
    await expect(getSupportSession("platform-user-1", "org-1")).resolves.toBeNull();
  });
});
