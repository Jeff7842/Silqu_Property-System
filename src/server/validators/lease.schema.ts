import { z } from "zod";

export const leaseSchema = z
  .object({
    unitId: z.string().trim().min(1, "Choose a unit."),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    rentKES: z.coerce.number().positive("Rent must be greater than zero."),
    depositKES: z.coerce.number().min(0, "Deposit can't be negative."),
    billingDay: z.coerce.number().int().min(1).max(28),
  })
  .refine((d) => d.endDate > d.startDate, { message: "End date must be after the start date.", path: ["endDate"] });

export type LeaseInput = z.infer<typeof leaseSchema>;
