import { type ButtonHTMLAttributes } from "react";

const VARIANT_CLASS = {
  primary: "bg-primary text-white hover:bg-primary-hover disabled:opacity-50",
  secondary: "bg-surface text-ink border border-line hover:bg-canvas disabled:opacity-50",
  ghost: "bg-transparent text-ink hover:bg-canvas disabled:opacity-50",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:opacity-50",
} as const;

const SIZE_CLASS = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANT_CLASS;
  size?: keyof typeof SIZE_CLASS;
  loading?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[--radius-control] font-semibold transition-colors active:scale-[0.98] ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
