import { type ReactNode } from "react";
import { auth, signOut } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { navForUser } from "@/lib/nav";
import { PortalShell } from "@/components/shell/portal-shell";
import { listNotifications, countUnreadNotifications } from "@/server/db/queries/notifications";

export default async function BusinessLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const [notifications, unreadCount] = await Promise.all([listNotifications(user.id), countUnreadNotifications(user.id)]);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <PortalShell
      brandSubtitle="Property Management"
      navItems={navForUser("business", user)}
      user={{ fullName: user.fullName, role: roleLabel(user.role, user.subRole) }}
      onSignOut={doSignOut}
      addAction={user.role === "MANAGER" ? { label: "Add property", href: "/app/properties" } : undefined}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </PortalShell>
  );
}

function roleLabel(role: string, subRole: string | null) {
  if (role === "EMPLOYEE" && subRole) {
    return `Employee · ${subRole.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`;
  }
  return role.charAt(0) + role.slice(1).toLowerCase();
}
