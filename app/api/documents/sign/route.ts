import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { r2, R2_BUCKET_PRIVATE } from "@/server/services/r2/client";
import { db } from "@/server/db/client";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// ponytail: tenant ID scans only for now : signed lease PDFs need a
// PDF-generation step that doesn't exist yet (Go reports service, later phase).
export async function POST(req: Request) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "onboardTenant")) {
    return NextResponse.json({ error: "You don't have permission to upload tenant documents." }, { status: 403 });
  }

  const { tenantId, contentType, size } = await req.json();

  if (!ALLOWED_TYPES[contentType]) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP or PDF files are allowed." }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 10MB or smaller." }, { status: 400 });
  }

  const tenant = await db.tenant.findFirst({ where: { id: tenantId, orgId: user.orgId! }, select: { id: true } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  if (!r2) {
    return NextResponse.json({ error: "File storage isn't configured yet." }, { status: 503 });
  }

  const key = `${user.orgId}/tenants/${tenantId}/id/${crypto.randomUUID()}.${ALLOWED_TYPES[contentType]}`;
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET_PRIVATE, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  );

  return NextResponse.json({ url, key });
}
