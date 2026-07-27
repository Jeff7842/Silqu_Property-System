import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

export function Input({
  label,
  error,
  hint,
  icon,
  prefix,
  suffix,
  endAdornment,
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  /** Leading Material Symbols icon, positioned like the Stitch design's icon-prefixed fields. */
  icon?: IconName;
  prefix?: string;
  suffix?: string;
  /** Trailing interactive element, e.g. a password show/hide button. */
  endAdornment?: ReactNode;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative flex items-stretch">
        {prefix && (
          <span className="flex items-center rounded-l-[--radius-control] border border-r-0 border-line bg-canvas px-3 text-sm text-ink-muted">
            {prefix}
          </span>
        )}
        {icon && (
          <Icon
            name={icon}
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        )}
        <input
          id={inputId}
          className={`h-11 w-full border border-line bg-surface text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${
            prefix ? "rounded-r-[--radius-control]" : "rounded-[--radius-control]"
          } ${icon ? "pl-10" : "px-3"} ${endAdornment ? "pr-10" : "pr-3"} ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {suffix && (
          <span className="flex items-center rounded-r-[--radius-control] border border-l-0 border-line bg-canvas px-3 text-sm text-ink-muted">
            {suffix}
          </span>
        )}
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{endAdornment}</div>
        )}
      </div>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
