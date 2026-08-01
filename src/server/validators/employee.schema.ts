import { z } from "zod";
import { kenyaPhoneSchema } from "@/lib/phone";

export const employeeRoleSchema = z.enum(["MANAGER", "CARETAKER", "FINANCE", "CUSTOMER_CARE", "OWNER_MANAGER"]);

export const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the employee's full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: kenyaPhoneSchema.optional().or(z.literal("")),
  roleType: employeeRoleSchema,
  password: z.string().min(8, "Use at least 8 characters for the password."),
  propertyIds: z.array(z.string()).default([]),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
