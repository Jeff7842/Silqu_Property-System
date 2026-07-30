import { z } from "zod";

export const maintenanceRequestSchema = z.object({
  category: z.enum(["PLUMBING", "ELECTRICAL", "STRUCTURAL", "SECURITY", "OTHER"]),
  description: z.string().trim().min(1, "Describe the issue."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment."),
});
