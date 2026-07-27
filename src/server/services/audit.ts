import { db } from "@/server/db/client";

export function logAudit(entry: {
  orgId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  // Fire-and-forget: an audit log write must never block or fail the
  // action it's recording.
  return db.auditLog
    .create({
      data: {
        orgId: entry.orgId ?? null,
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before: entry.before === undefined ? undefined : (entry.before as object),
        after: entry.after === undefined ? undefined : (entry.after as object),
      },
    })
    .catch((err) => console.error("[audit] failed to write log:", err));
}
