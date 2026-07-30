import { z } from "zod";

export const announcementSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(120),
    body: z.string().trim().min(3, "Message is too short").max(2000),
    audience: z.enum(["ALL", "PROPERTY", "UNIT"]),
    propertyId: z.string().optional(),
    unitId: z.string().optional(),
  })
  .refine((d) => d.audience !== "PROPERTY" || !!d.propertyId, { message: "Choose a property", path: ["propertyId"] })
  .refine((d) => d.audience !== "UNIT" || !!d.unitId, { message: "Choose a unit", path: ["unitId"] });
