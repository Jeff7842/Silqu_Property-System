import { type ReactNode } from "react";
import { auth, signOut } from "@/server/auth/tenant";
import { requireRole } from "@/server/auth/session";
import { navForUser } from "@/lib/nav";
import { PortalShell } from "@/components/shell/portal-shell";

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/my/login" });
  }

  return (
    <PortalShell
      brandTitle="SILQU"
      brandSubtitle="Tenant Portal"
      navItems={navForUser("tenant", user)}
      user={{ fullName: user.fullName, role: "Tenant" }}
      onSignOut={doSignOut}
    >
      {children}
    </PortalShell>
  );
}
