import { z } from "zod";

export const paymentSchema = z.object({
  leaseId: z.string().trim().min(1, "Choose a lease."),
  amountKES: z.coerce.number().positive("Amount must be greater than zero."),
  method: z.enum(["MPESA", "BANK", "CASH"]),
  reference: z.string().trim().optional(),
  paidAt: z.coerce.date(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
