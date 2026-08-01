import { z } from "zod";
import { kenyaPhoneSchema } from "@/lib/phone";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpStep1Schema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  organizationName: z.string().trim().min(1, "Enter your estate or company name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: kenyaPhoneSchema,
  county: z.string().trim().min(1),
  password: z.string().min(8, "Use at least 8 characters."),
});
