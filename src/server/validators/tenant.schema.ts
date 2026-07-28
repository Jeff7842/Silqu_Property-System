import { z } from "zod";

export const tenantSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the tenant's full name."),
  nationalId: z.string().trim().min(1, "Enter a national ID or passport number."),
  phone: z.string().trim().regex(/^7\d{8}$/, "Enter a 9-digit number starting with 7, e.g. 712345678."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  nextOfKinName: z.string().trim().optional(),
  nextOfKinPhone: z.string().trim().optional(),
});

export type TenantInput = z.infer<typeof tenantSchema>;
