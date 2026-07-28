import { NextResponse } from "next/server";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { previewInvoiceGeneration } from "@/server/services/billing/generate-invoices";

export async function GET(req: Request) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, "generateInvoices")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month) return NextResponse.json({ error: "Missing year/month" }, { status: 400 });

  const preview = await previewInvoiceGeneration(user.orgId!, year, month);
  return NextResponse.json(preview);
}
