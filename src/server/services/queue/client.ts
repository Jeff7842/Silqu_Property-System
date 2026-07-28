import { Client } from "@upstash/qstash";

/** Undefined until QSTASH_TOKEN is set — not provisioned yet. Callers fall back to running work inline. */
export const qstash = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : undefined;

/** Publishes a job, or no-ops (logs) if QStash isn't configured — caller decides whether to also run inline. */
export async function publishJob(path: string, body: unknown) {
  if (!qstash || !process.env.QSTASH_TARGET_BASE_URL) {
    console.log(`[queue] QStash not configured — skipping publish to ${path}`, body);
    return null;
  }
  const res = await qstash.publishJSON({ url: `${process.env.QSTASH_TARGET_BASE_URL}${path}`, body });
  return res.messageId;
}
