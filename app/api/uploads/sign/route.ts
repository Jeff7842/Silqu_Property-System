import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { r2, R2_BUCKET_PUBLIC } from "@/server/services/r2/client";
import { db } from "@/server/db/client";
import { hasAccess } from "@/server/auth/permissions";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Property photos only (public bucket, no Document row : see setPropertyPhotoAction).
// Private tenant documents (ID scans) sign through /api/documents/sign instead.
export async function POST(req: Request) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "createEditProperty")) {
    return NextResponse.json({ error: "You don't have permission to upload photos." }, { status: 403 });
  }

  const { propertyId, contentType, size } = await req.json();

  if (!ALLOWED_TYPES[contentType]) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const property = await db.property.findFirst({ where: { id: propertyId, orgId: user.orgId! }, select: { id: true } });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (!r2) {
    return NextResponse.json({ error: "File storage isn't configured yet." }, { status: 503 });
  }

  const key = `${user.orgId}/properties/${propertyId}/photo/${crypto.randomUUID()}.${ALLOWED_TYPES[contentType]}`;
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET_PUBLIC, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  );

  return NextResponse.json({ url, key });
}
