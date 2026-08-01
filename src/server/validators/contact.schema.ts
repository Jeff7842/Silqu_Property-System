import { z } from "zod";
import { optionalKenyaPhoneSchema } from "@/lib/phone";

export const CONTACT_SUBJECTS = [
  "General inquiry",
  "Technical support",
  "Billing question",
  "Partnership",
] as const;

// Public marketing contact form : no orgId/session to validate against,
// unlike the in-app schemas. Kept intentionally small.
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: optionalKenyaPhoneSchema,
  subject: z.enum(CONTACT_SUBJECTS),
  message: z.string().trim().min(10, "Tell us a bit more : at least 10 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
