import type { MaintenanceStatus } from "@/generated/prisma/client";

export const NEXT_MAINTENANCE_STATUS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
};
