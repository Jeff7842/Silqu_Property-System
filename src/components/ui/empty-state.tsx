import { type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

export function EmptyState({
  icon = "emptyFolder",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Icon name={icon} size={56} className="text-accent" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}
