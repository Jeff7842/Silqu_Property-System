"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth/business";
import { requireRole } from "@/server/auth/session";
import { hasAccess } from "@/server/auth/permissions";
import { logAudit } from "@/server/services/audit";
import { bustKpiCache } from "@/server/services/redis/kpi-cache";
import { runInvoiceGenerationForOrg } from "@/server/services/billing/run-generation";
import { allocatePayment } from "@/server/services/billing/allocate-payment";
import { generateAndStoreReceipt } from "@/server/services/billing/generate-receipt";
import { toCents } from "@/lib/money";
import { paymentSchema } from "@/server/validators/payment.schema";

export type ActionState = { error?: string; success?: boolean } | undefined;

async function requireBillingStaff(capability: "generateInvoices" | "recordPayment") {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE"]);
  if (!hasAccess(user, capability)) {
    return { user: null, error: "You don't have permission to do that." } as const;
  }
  return { user, error: null } as const;
}

export async function generateInvoicesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireBillingStaff("generateInvoices");
  if (!user) return { error };

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!year || !month || month < 1 || month > 12) return { error: "Choose a valid month." };

  const result = await runInvoiceGenerationForOrg(user.orgId!, year, month);
  if (result.status === "in_progress") {
    return { error: "Invoice generation for this month is already running. Try again shortly." };
  }

  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "invoices.generated", entityType: "Organization", entityId: user.orgId, after: { year, month, created: result.created } });
  await bustKpiCache(user.orgId!);
  revalidatePath("/app/invoices");
  return { success: true };
}

export async function recordPaymentAction(tenantId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, error } = await requireBillingStaff("recordPayment");
  if (!user) return { error };

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const lease = await db.lease.findFirst({ where: { id: parsed.data.leaseId, orgId: user.orgId!, tenantId } });
  if (!lease) return { error: "Lease not found." };

  const { paymentId, creditCents } = await allocatePayment({
    orgId: user.orgId!,
    tenantId,
    leaseId: lease.id,
    amountCents: toCents(parsed.data.amountKES),
    method: parsed.data.method,
    reference: parsed.data.reference || undefined,
    paidAt: parsed.data.paidAt,
    recordedById: user.id,
  });

  logAudit({ orgId: user.orgId, actorUserId: user.id, action: "payment.recorded", entityType: "Payment", entityId: paymentId, after: { tenantId, amountCents: toCents(parsed.data.amountKES), creditCents } });

  // Receipt generation runs after the payment transaction has committed —
  // called directly since QStash isn't provisioned in dev (see /api/jobs/send-receipt
  // for the queued path once it is). Best-effort: a receipt failure shouldn't undo a recorded payment.
  try {
    await generateAndStoreReceipt(paymentId);
  } catch (e) {
    console.error("[receipt] generation failed for payment", paymentId, e);
  }

  await bustKpiCache(user.orgId!);
  revalidatePath(`/app/tenants/${tenantId}`);
  revalidatePath("/app/invoices");
  revalidatePath("/app/reports");
  return { success: true };
}
