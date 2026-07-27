import { type InputHTMLAttributes, useId } from "react";

export function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
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
      <div className="flex items-stretch rounded-[--radius-control] border border-line bg-surface focus-within:ring-2 focus-within:ring-accent">
        {prefix && (
          <span className="flex items-center px-3 text-sm text-ink-muted border-r border-line">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-[--radius-control] border-0 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0 ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {suffix && (
          <span className="flex items-center px-3 text-sm text-ink-muted border-l border-line">
            {suffix}
          </span>
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
