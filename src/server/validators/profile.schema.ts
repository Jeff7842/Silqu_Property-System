import { z } from "zod";

// Tenant self-service password change. Confirmation field catches typos
// client-side never see (no visible confirm field would let a fat-fingered
// new password lock the tenant out with no recovery path but a manager reset).
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  });
