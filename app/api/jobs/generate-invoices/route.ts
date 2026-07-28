import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { publishJob } from "@/server/services/queue/client";
import { withJobSignature } from "@/server/services/queue/verify";

// Cron entry point (scripts/qstash-schedules.mjs schedules this for the 1st at 06:00
// Africa/Nairobi). Fans out one job per active org rather than generating inline,
// so one slow/failing org can't block the rest.
async function handler(req: Request) {
  const now = new Date();
  const body = await req.json().catch(() => ({}));
  const year = body.year ?? now.getFullYear();
  const month = body.month ?? now.getMonth() + 1;

  const orgs = await db.organization.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  for (const org of orgs) {
    await publishJob("/api/jobs/generate-invoices-for-org", { orgId: org.id, year, month });
  }

  return NextResponse.json({ fanned: orgs.length });
}

export const POST = withJobSignature(handler);
