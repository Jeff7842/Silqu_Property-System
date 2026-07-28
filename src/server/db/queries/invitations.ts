import { db } from "@/server/db/client";

export function listPendingInvitations(orgId: string) {
  return db.invitation.findMany({
    where: { orgId, acceptedAt: null, role: "TENANT" },
    include: { tenant: true },
    orderBy: { createdAt: "desc" },
  });
}
