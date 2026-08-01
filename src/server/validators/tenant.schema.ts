import { z } from "zod";
import { kenyaPhoneSchema } from "@/lib/phone";

export const tenantSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the tenant's full name."),
  nationalId: z.string().trim().min(1, "Enter a national ID or passport number."),
  phone: kenyaPhoneSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  nextOfKinName: z.string().trim().optional(),
  nextOfKinPhone: z.string().trim().optional(),
});

export type TenantInput = z.infer<typeof tenantSchema>;
