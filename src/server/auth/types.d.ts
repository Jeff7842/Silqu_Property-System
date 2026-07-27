import type { Role, EmployeeSubRole } from "@/generated/prisma/client";
import type { Portal } from "@/server/auth/portals";

declare module "next-auth" {
  interface User {
    orgId: string | null;
    role: Role;
    subRole: EmployeeSubRole | null;
    fullName: string;
  }

  interface Session {
    user: {
      id: string;
      orgId: string | null;
      role: Role;
      subRole: EmployeeSubRole | null;
      portal: Portal;
      email: string;
      fullName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string | null;
    role: Role;
    subRole: EmployeeSubRole | null;
    portal: Portal;
    fullName: string;
  }
}
