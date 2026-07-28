import { type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

const TONE_CLASS = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
} as const;

export function KpiCard({
  label,
  value,
  icon,
  tone = "default",
  trend,
}: {
  label: string;
  value: ReactNode;
  icon: IconName;
  tone?: keyof typeof TONE_CLASS;
  trend?: string;
}) {
  return (
    <div className="rounded-[--radius-card] border border-line bg-surface p-5 shadow-[--shadow-card]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
          {trend && <p className="mt-1 text-xs text-ink-muted">{trend}</p>}
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[tone]}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
    </div>
  );
}
