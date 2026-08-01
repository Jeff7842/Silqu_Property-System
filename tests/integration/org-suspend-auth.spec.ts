import { afterAll, describe, expect, it, vi } from "vitest";

// authorizeCredentials reads the request IP off next/headers' headers(), which
// only works inside a real Next.js request scope. Outside of one it throws
// "headers was called outside a request scope" : so stub it the same way a
// request with no forwarded-for header would look.
vi.mock("next/headers", () => ({
  headers: async () => new Map<string, string>(),
}));

import { db } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";
import { authorizeCredentials } from "@/server/auth/authorize";

// Hits the real dev database (needs DATABASE_URL : see vitest.setup.ts) since
// this specifically proves org suspension blocks sign-in for org-scoped
// roles, not just the password/role checks unit tests already cover.
describe("org suspension blocks sign-in", () => {
  const plainPassword = "Test-Password-123!";
  const suffix = Date.now();

  let suspendedOrgId: string;
  let suspendedUserId: string;
  let activeOrgId: string;
  let activeUserId: string;

  afterAll(async () => {
    // Delete users before their orgs to respect the User -> Organization FK.
    await db.user.deleteMany({ where: { id: { in: [suspendedUserId, activeUserId] } } });
    await db.organization.deleteMany({ where: { id: { in: [suspendedOrgId, activeOrgId] } } });
  }, 30_000);

  it("rejects a MANAGER whose organization is SUSPENDED", async () => {
    const passwordHash = await hashPassword(plainPassword);
    const email = `test-suspended-${suffix}@example.com`;

    const org = await db.organization.create({
      data: {
        name: `Test Suspended Org ${suffix}`,
        county: "Nairobi",
        phone: "254700000001",
        email: `test-suspended-org-${suffix}@example.com`,
        status: "SUSPENDED",
      },
    });
    suspendedOrgId = org.id;

    const user = await db.user.create({
      data: {
        orgId: org.id,
        email,
        fullName: "Test Suspended Manager",
        passwordHash,
        role: "MANAGER",
        status: "ACTIVE",
      },
    });
    suspendedUserId = user.id;

    const result = await authorizeCredentials("business", email, plainPassword);
    expect(result).toBeNull();
  }, 30_000);

  it("control: accepts a MANAGER whose organization is ACTIVE", async () => {
    const passwordHash = await hashPassword(plainPassword);
    const email = `test-active-${suffix}@example.com`;

    const org = await db.organization.create({
      data: {
        name: `Test Active Org ${suffix}`,
        county: "Nairobi",
        phone: "254700000002",
        email: `test-active-org-${suffix}@example.com`,
        status: "ACTIVE",
      },
    });
    activeOrgId = org.id;

    const user = await db.user.create({
      data: {
        orgId: org.id,
        email,
        fullName: "Test Active Manager",
        passwordHash,
        role: "MANAGER",
        status: "ACTIVE",
      },
    });
    activeUserId = user.id;

    const result = await authorizeCredentials("business", email, plainPassword);
    expect(result).not.toBeNull();
    expect(result?.email).toBe(email);
  }, 30_000);
});
