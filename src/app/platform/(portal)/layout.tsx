import { type ReactNode } from "react";
import { auth, signOut } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { navForUser } from "@/lib/nav";
import { PortalShell } from "@/components/shell/portal-shell";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/platform/login" });
  }

  return (
    <PortalShell
      brandTitle="SILQU"
      brandSubtitle="Platform Console"
      navItems={navForUser("platform", user)}
      user={{ fullName: user.fullName, role: user.role === "PLATFORM_ADMIN" ? "Platform Admin" : "Platform Support" }}
      onSignOut={doSignOut}
    >
      {children}
    </PortalShell>
  );
}
