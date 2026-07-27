import { type ReactNode } from "react";

export function Card({
  header,
  footer,
  padded = true,
  className = "",
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-[--radius-card] border border-line bg-surface shadow-[--shadow-card] ${className}`}
    >
      {header && <div className="border-b border-line px-5 py-4">{header}</div>}
      <div className={padded ? "px-5 py-4" : ""}>{children}</div>
      {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
    </div>
  );
}
