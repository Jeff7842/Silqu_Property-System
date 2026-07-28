import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

type Handler = (req: Request) => Promise<Response>;

/**
 * Wraps a /api/jobs/* handler with QStash signature verification. If the
 * signing keys aren't configured yet, returns a handler that always rejects
 * — verifySignatureAppRouter itself throws at import time without them,
 * which would otherwise take the whole build down. Never runs a job body
 * without a verified signature.
 */
export function withJobSignature(handler: Handler) {
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
    return async () => NextResponse.json({ error: "Job queue isn't configured yet." }, { status: 503 });
  }
  return verifySignatureAppRouter(handler);
}
