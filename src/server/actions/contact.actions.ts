"use server";

import { contactSchema } from "@/server/validators/contact.schema";
import { escapeHtml, sendEmail } from "@/server/services/email/client";

export type ContactState = { error?: string; success?: boolean } | undefined;

// No requireRole() here, unlike the in-app server actions : this is the
// public marketing contact form and has no session to check. Every other
// non-negotiable still applies: input is re-validated server-side with the
// matching Zod schema, nothing here trusts the client.
export async function submitContactAction(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Never log secrets; this submission is not sensitive.
  console.log(`[contact] ${parsed.data.subject} from ${parsed.data.name} <${parsed.data.email}>`);

  // No internal support inbox address is configured anywhere in this project
  // yet (no CONTACT_INBOX_EMAIL/SUPPORT_EMAIL env var), so this sends a
  // confirmation to the person who submitted rather than routing to a team
  // inbox that doesn't exist. Wiring a staff-facing notification too is a
  // follow-up once a support inbox address is decided.
  await sendEmail({
    to: parsed.data.email,
    subject: "We received your message : SILQU",
    template: "contact-confirmation",
    html: `<p>Hi ${escapeHtml(parsed.data.name)},</p><p>Thanks for reaching out about <strong>${escapeHtml(parsed.data.subject)}</strong>. Our team has received your message and will get back to you shortly.</p><p>Your message:</p><p>${escapeHtml(parsed.data.message)}</p>`,
  });

  return { success: true };
}
