import { describe, expect, it } from "vitest";
import { can, actorFor, type Actor, type Capability } from "@/server/auth/permissions";

// Transcribed independently from docs/SILQU_BUILD_PLAN_V2.md section 6.2 —
// deliberately not shared code with src/server/auth/permissions.ts, so this
// actually catches transcription drift instead of testing a copy of itself.
const ACTORS: Actor[] = [
  "PLAT_ADMIN",
  "PLAT_SUPPORT",
  "MANAGER",
  "EMP_FINANCE",
  "EMP_CARE",
  "EMP_OWNER",
  "CARETAKER",
  "TENANT",
];

const EXPECTED: Record<Capability, string> = {
  // Row order matches ACTORS above; letters: f=full r=read s=scoped n=none
  viewOwnDashboard: "ffffffss",
  createEditProperty: "nnfnnfnn",
  viewProperties: "rsfrrfsn",
  createEditUnit: "nnfnnfnn",
  updateUnitStatus: "nnfnnfsn",
  onboardTenant: "nnfnffnn",
  viewTenantRecords: "rsfrffsn",
  createEndLease: "nnfnnfnn",
  generateInvoices: "nnffnfnn",
  recordPayment: "nnffnfnn",
  viewOwnInvoicesPayments: "nnnnnnns",
  payRentMpesa: "nnnnnnns",
  viewArrearsReport: "rrffrfnn",
  raiseMaintenanceRequest: "nnfnffss",
  resolveMaintenanceRequest: "nnfnffsn",
  closeMaintenanceRequest: "nnfnnfns",
  publishAnnouncement: "nnfnffnn",
  inviteManageStaff: "nnfnnnnn",
  manageOwnSubscription: "nnfnnnnn",
  viewOwnOrgAuditLog: "nnfnnrnn",
  suspendOrganization: "fnnnnnnn",
  viewPlatformAuditLog: "frnnnnnn",
  replayQueueJob: "fnnnnnnn",
  toggleFeatureFlag: "fnnnnnnn",
  startSupportSession: "ffnnnnnn",
};

const LETTER_TO_ACCESS: Record<string, string> = { f: "full", r: "read", s: "scoped", n: "none" };

describe("permission matrix (build plan section 6.2)", () => {
  for (const [capability, letters] of Object.entries(EXPECTED) as [Capability, string][]) {
    it.each(ACTORS.map((actor, i) => [actor, LETTER_TO_ACCESS[letters[i]]] as const))(
      `${capability}: %s -> %s`,
      (actor, expected) => {
        const user = actorToUser(actor);
        expect(can(user, capability)).toBe(expected);
      },
    );
  }
});

describe("actorFor", () => {
  it("maps EMPLOYEE + subRole to the right actor", () => {
    expect(actorFor({ role: "EMPLOYEE", subRole: "FINANCE" })).toBe("EMP_FINANCE");
    expect(actorFor({ role: "EMPLOYEE", subRole: "CUSTOMER_CARE" })).toBe("EMP_CARE");
    expect(actorFor({ role: "EMPLOYEE", subRole: "OWNER_MANAGER" })).toBe("EMP_OWNER");
  });

  it("maps non-employee roles directly", () => {
    expect(actorFor({ role: "MANAGER", subRole: null })).toBe("MANAGER");
    expect(actorFor({ role: "TENANT", subRole: null })).toBe("TENANT");
    expect(actorFor({ role: "CARETAKER", subRole: null })).toBe("CARETAKER");
    expect(actorFor({ role: "PLATFORM_ADMIN", subRole: null })).toBe("PLAT_ADMIN");
    expect(actorFor({ role: "PLATFORM_SUPPORT", subRole: null })).toBe("PLAT_SUPPORT");
  });
});

function actorToUser(actor: Actor): { role: Parameters<typeof can>[0]["role"]; subRole: Parameters<typeof can>[0]["subRole"] } {
  switch (actor) {
    case "PLAT_ADMIN":
      return { role: "PLATFORM_ADMIN", subRole: null };
    case "PLAT_SUPPORT":
      return { role: "PLATFORM_SUPPORT", subRole: null };
    case "MANAGER":
      return { role: "MANAGER", subRole: null };
    case "EMP_FINANCE":
      return { role: "EMPLOYEE", subRole: "FINANCE" };
    case "EMP_CARE":
      return { role: "EMPLOYEE", subRole: "CUSTOMER_CARE" };
    case "EMP_OWNER":
      return { role: "EMPLOYEE", subRole: "OWNER_MANAGER" };
    case "CARETAKER":
      return { role: "CARETAKER", subRole: null };
    case "TENANT":
      return { role: "TENANT", subRole: null };
  }
}
