import { Icon } from "@/components/ui/icon";
import type { MaintenanceStatus } from "@/generated/prisma/client";

const STEPS: MaintenanceStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const LABELS: Record<MaintenanceStatus, string> = { OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In progress", RESOLVED: "Resolved", CLOSED: "Closed" };

export function StatusTimeline({ status }: { status: MaintenanceStatus }) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex flex-col gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex size-6 items-center justify-center rounded-full text-xs ${done || current ? "bg-primary text-white" : "bg-line text-ink-muted"}`}>
                {done ? <Icon name="check" size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-px flex-1 ${done ? "bg-primary" : "bg-line"}`} style={{ minHeight: 20 }} />}
            </div>
            <span className={`pb-5 text-sm ${current ? "font-semibold text-ink" : done ? "text-ink" : "text-ink-muted"}`}>{LABELS[step]}</span>
          </div>
        );
      })}
    </div>
  );
}
