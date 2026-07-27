import { type SelectHTMLAttributes, useId } from "react";

export function Select({
  label,
  error,
  hint,
  className = "",
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`h-11 rounded-[--radius-control] border border-line bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
