import { z } from "zod";

/** "254712345678" -> "+254 712 345 678" */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/^254/, "");
  return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Accepts 0712345678, 254712345678, +254712345678, 712345678 (Safaricom/
 * Airtel/Telkom 07xx and 01xx ranges) and returns the bare 9-digit local
 * number SILQU stores, e.g. "712345678". Returns null if it can't be
 * normalized to a valid Kenyan mobile number.
 */
export function normalizeKenyaPhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  let local: string | null = null;
  if (/^\+254\d{9}$/.test(digits)) local = digits.slice(4);
  else if (/^254\d{9}$/.test(digits)) local = digits.slice(3);
  else if (/^0\d{9}$/.test(digits)) local = digits.slice(1);
  else if (/^\d{9}$/.test(digits)) local = digits;
  return local && /^[17]\d{8}$/.test(local) ? local : null;
}

const PHONE_HINT = "Enter a valid Kenyan phone number, e.g. 0712345678.";

export const kenyaPhoneSchema = z
  .string()
  .trim()
  .transform((v) => normalizeKenyaPhone(v))
  .refine((v): v is string => v !== null, PHONE_HINT);

export const optionalKenyaPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? normalizeKenyaPhone(v) : undefined))
  .refine((v) => v !== null, PHONE_HINT);
