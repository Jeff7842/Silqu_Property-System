import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { redis } from "@/server/services/redis/client";

// Deliberately unauthenticated: the checkout ID is a high-entropy value
// returned only to the browser that initiated this specific STK push, never
// exposed anywhere else : possession of it is proof enough for a status-only
// read (no phone, no amount, nothing else). Kept out of Redis's cache TTL
// story on purpose: polling already happens every 3s, a 2s cache barely
// helps a single pollor but smooths bursts if the same ID is ever hit twice.
export async function GET(_req: Request, { params }: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await params;
  const cacheKey = `stk-status:${checkoutId}`;

  if (redis) {
    const cached = await redis.get<{ status: string; resultDesc: string | null }>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const txn = await db.mpesaTransaction.findUnique({
    where: { checkoutRequestId: checkoutId },
    select: { status: true, resultDesc: true },
  });
  if (!txn) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const result = { status: txn.status, resultDesc: txn.resultDesc };
  if (redis) await redis.set(cacheKey, result, { ex: 2 });

  return NextResponse.json(result);
}
