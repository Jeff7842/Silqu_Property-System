import { z } from "zod";

export const assignCaretakerSchema = z.object({
  userId: z.string().min(1, "Choose a caretaker."),
  unitId: z
    .string()
    .optional()
    .transform((v) => v || null),
});
