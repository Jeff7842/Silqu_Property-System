import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { runInvoiceGenerationForOrg } from "@/server/services/billing/run-generation";
import { publishJob } from "@/server/services/queue/client";
import { withJobSignature } from "@/server/services/queue/verify";

async function handler(req: Request) {
  const { orgId, year, month } = await req.json();
  if (!orgId || !year || !month) {
    // Malformed payload — retrying won't help, so ack it rather than let QStash retry forever.
    return NextResponse.json({ error: "Missing orgId/year/month" }, { status: 200 });
  }

  const result = await runInvoiceGenerationForOrg(orgId, year, month);
  if (result.status === "in_progress") {
    return NextResponse.json({ status: "in_progress" });
  }

  if (result.created > 0) {
    const invoices = await db.invoice.findMany({
      where: { orgId, periodYear: year, periodMonth: month },
      select: { id: true },
    });
    for (const inv of invoices) {
      await publishJob("/api/jobs/send-invoice-email", { invoiceId: inv.id });
    }
  }

  return NextResponse.json({ created: result.created });
}

export const POST = withJobSignature(handler);
