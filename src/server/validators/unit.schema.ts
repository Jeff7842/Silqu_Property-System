import { z } from "zod";

export const unitSchema = z.object({
  label: z.string().trim().min(1, "Enter a unit label, e.g. A1."),
  unitType: z.string().trim().min(1, "Enter a unit type, e.g. 1 Bedroom."),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms can't be negative.").max(20),
  rentKES: z.coerce.number().positive("Rent must be greater than zero."),
  depositKES: z.coerce.number().min(0, "Deposit can't be negative."),
});

export type UnitInput = z.infer<typeof unitSchema>;

export const bulkUnitSchema = z
  .object({
    prefix: z.string().trim().min(1, "Enter a label prefix, e.g. A."),
    startNumber: z.coerce.number().int().min(1, "Start number must be at least 1."),
    endNumber: z.coerce.number().int().min(1, "End number must be at least 1."),
    unitType: z.string().trim().min(1, "Enter a unit type, e.g. 1 Bedroom."),
    bedrooms: z.coerce.number().int().min(0).max(20),
    rentKES: z.coerce.number().positive("Rent must be greater than zero."),
    depositKES: z.coerce.number().min(0, "Deposit can't be negative."),
  })
  .refine((d) => d.endNumber >= d.startNumber, {
    message: "End number must be greater than or equal to the start number.",
    path: ["endNumber"],
  })
  .refine((d) => d.endNumber - d.startNumber < 100, {
    message: "Bulk create is limited to 100 units at a time.",
    path: ["endNumber"],
  });

export type BulkUnitInput = z.infer<typeof bulkUnitSchema>;

export const unitStatusSchema = z.object({
  status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE", "RESERVED"]),
});
