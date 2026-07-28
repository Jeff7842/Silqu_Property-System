import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { can } from "@/server/auth/permissions";
import { r2, R2_BUCKET_PRIVATE } from "@/server/services/r2/client";
import { getDocumentById, getTenantActiveUnit } from "@/server/db/queries/documents";
import { isUnitAssignedToCaretaker } from "@/server/db/queries/properties";
import { logAudit } from "@/server/services/audit";

export async function GET(req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const { documentId } = await params;

  const doc = await getDocumentById(user.orgId!, documentId);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  if (doc.entityType === "TENANT") {
    const access = can(user, "viewTenantRecords");
    if (access === "none") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (access === "scoped") {
      const activeUnit = await getTenantActiveUnit(doc.entityId);
      const assigned = activeUnit && (await isUnitAssignedToCaretaker(user.id, activeUnit.unitId, activeUnit.unit.propertyId));
      if (!assigned) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  if (!r2) return NextResponse.json({ error: "File storage isn't configured yet." }, { status: 503 });

  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET_PRIVATE, Key: doc.fileKey }),
    { expiresIn: 300 },
  );

  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "document.fetched", entityType: "Document", entityId: doc.id });

  return NextResponse.redirect(url);
}
