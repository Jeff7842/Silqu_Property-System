import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpStep1Schema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  organizationName: z.string().trim().min(1, "Enter your estate or company name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^7\d{8}$/, "Enter a 9-digit number starting with 7, e.g. 712345678."),
  county: z.string().trim().min(1),
  password: z.string().min(8, "Use at least 8 characters."),
});
