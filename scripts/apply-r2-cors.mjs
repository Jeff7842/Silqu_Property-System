// Applies cors.json to both R2 buckets so the browser can PUT directly to
// presigned upload URLs (app/api/uploads/sign, app/api/documents/sign).
// Re-run this whenever cors.json changes or a new origin needs to upload.
import { readFileSync } from "node:fs";
import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_PUBLIC, R2_BUCKET_PRIVATE } from "../src/server/services/r2/client.ts";

if (!r2) {
  console.error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set.");
  process.exit(1);
}

const CORSRules = JSON.parse(readFileSync(new URL("../cors.json", import.meta.url)));

for (const bucket of [R2_BUCKET_PUBLIC, R2_BUCKET_PRIVATE]) {
  await r2.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules } }));
  console.log(`✓ CORS applied to ${bucket}`);
}
