import { type InputHTMLAttributes, useId } from "react";

export function Switch({
  label,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <label htmlFor={switchId} className="flex items-center gap-2 text-sm text-ink">
      <span className="relative inline-block h-6 w-11 shrink-0">
        <input
          id={switchId}
          type="checkbox"
          className={`peer sr-only ${className}`}
          {...props}
        />
        <span className="absolute inset-0 rounded-full bg-line transition-colors peer-checked:bg-primary" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[--shadow-card] transition-transform peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  );
}
