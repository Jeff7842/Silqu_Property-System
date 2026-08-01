import { type ReactNode } from "react";
import { auth, signOut } from "@/server/auth/tenant";
import { requireRole } from "@/server/auth/session";
import { navForUser } from "@/lib/nav";
import { PortalShell } from "@/components/shell/portal-shell";
import { listNotifications, countUnreadNotifications } from "@/server/db/queries/notifications";

export default async function TenantLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = requireRole(session, ["TENANT"]);
  const [notifications, unreadCount] = await Promise.all([listNotifications(user.id), countUnreadNotifications(user.id)]);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/my/login" });
  }

  return (
    <PortalShell
      brandSubtitle="Tenant Portal"
      navItems={navForUser("tenant", user)}
      user={{ fullName: user.fullName, role: "Tenant" }}
      onSignOut={doSignOut}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </PortalShell>
  );
}
