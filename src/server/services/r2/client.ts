import { S3Client } from "@aws-sdk/client-s3";

/** Undefined until R2_* env vars are set : not provisioned yet. Callers must handle it. */
export const r2 =
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      })
    : undefined;

export const R2_BUCKET_PUBLIC = process.env.R2_BUCKET_PUBLIC ?? "silqu-public";
export const R2_BUCKET_PRIVATE = process.env.R2_BUCKET_PRIVATE ?? "silqu-private";
