import { z } from "zod";

const PROPERTY_TYPES = ["APARTMENT", "BUNGALOW", "MAISONETTE", "COMMERCIAL", "OTHER"] as const;

export const propertySchema = z.object({
  name: z.string().trim().min(1, "Enter a property name."),
  county: z.string().trim().min(1, "Select a county."),
  town: z.string().trim().min(1, "Enter a town or estate."),
  address: z.string().trim().min(1, "Enter a street address."),
  type: z.enum(PROPERTY_TYPES),
});

export type PropertyInput = z.infer<typeof propertySchema>;
