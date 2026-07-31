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

/** Dead-letter queue size, or 0 if QStash isn't configured — surfaced on the platform dashboard so failures can't go unwatched (build plan section 11). */
export async function getDlqCount(): Promise<number> {
  if (!qstash) return 0;
  const dlq = await qstash.dlq.listMessages({ count: 100 }).catch(() => ({ messages: [] as unknown[] }));
  return dlq.messages.length;
}
