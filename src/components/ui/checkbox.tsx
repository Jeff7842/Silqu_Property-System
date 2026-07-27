import { type InputHTMLAttributes, useId } from "react";

export function Checkbox({
  label,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label htmlFor={checkboxId} className="flex items-center gap-2 text-sm text-ink">
      <input
        id={checkboxId}
        type="checkbox"
        className={`size-4 rounded border-line text-primary focus:ring-2 focus:ring-accent ${className}`}
        {...props}
      />
      {label}
    </label>
  );
}
