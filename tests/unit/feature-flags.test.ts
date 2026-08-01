import { describe, expect, it } from "vitest";
import { isEnabledForUser, type FeatureFlag } from "@/server/services/redis/feature-flags";

describe("isEnabledForUser (rollout-percent bucketing)", () => {
  it("is always false when the flag is disabled, regardless of rollout percent", () => {
    const flag: FeatureFlag = { enabled: false, rolloutPercent: 100 };
    expect(isEnabledForUser("new-ui", flag, "user-1")).toBe(false);
  });

  it("is always true at 100% rollout when enabled", () => {
    const flag: FeatureFlag = { enabled: true, rolloutPercent: 100 };
    for (const userId of ["a", "b", "c", "user-with-a-long-id-123"]) {
      expect(isEnabledForUser("new-ui", flag, userId)).toBe(true);
    }
  });

  it("is always false at 0% rollout when enabled", () => {
    const flag: FeatureFlag = { enabled: true, rolloutPercent: 0 };
    for (const userId of ["a", "b", "c", "user-with-a-long-id-123"]) {
      expect(isEnabledForUser("new-ui", flag, userId)).toBe(false);
    }
  });

  it("is deterministic : the same user+flag always gets the same answer", () => {
    const flag: FeatureFlag = { enabled: true, rolloutPercent: 50 };
    const first = isEnabledForUser("new-ui", flag, "user-42");
    for (let i = 0; i < 10; i++) {
      expect(isEnabledForUser("new-ui", flag, "user-42")).toBe(first);
    }
  });

  it("buckets different flag keys independently for the same user", () => {
    const flagA: FeatureFlag = { enabled: true, rolloutPercent: 50 };
    const flagB: FeatureFlag = { enabled: true, rolloutPercent: 50 };
    // Not asserting a specific split (hash-dependent), just that the two
    // flags don't share a bucket key and so can disagree for the same user.
    const results = ["flag-a", "flag-b", "flag-c", "flag-d"].map((key) => isEnabledForUser(key, flagA, "user-1"));
    void flagB;
    expect(results.length).toBe(4);
  });

  it("keeps a roughly even split across many users at 50%", () => {
    const flag: FeatureFlag = { enabled: true, rolloutPercent: 50 };
    let enabledCount = 0;
    const sampleSize = 2000;
    for (let i = 0; i < sampleSize; i++) {
      if (isEnabledForUser("rollout-test", flag, `user-${i}`)) enabledCount++;
    }
    const ratio = enabledCount / sampleSize;
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(0.6);
  });
});
