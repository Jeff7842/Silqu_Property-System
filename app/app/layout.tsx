import { type ReactNode } from "react";
import { auth, signOut } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { navForUser } from "@/lib/nav";
import { PortalShell } from "@/components/shell/portal-shell";

export default async function BusinessLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <PortalShell
      brandTitle="SILQU"
      brandSubtitle="Property Management"
      navItems={navForUser("business", user)}
      user={{ fullName: user.fullName, role: roleLabel(user.role, user.subRole) }}
      onSignOut={doSignOut}
      addAction={user.role === "MANAGER" ? { label: "Add property", href: "/app/properties" } : undefined}
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
