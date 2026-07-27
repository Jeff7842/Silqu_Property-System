import { type ReactNode } from "react";

/** Preline dropdown pattern. PrelineClient's autoInit() wires up .hs-dropdown. */
export function Dropdown({
  trigger,
  children,
  className = "",
}: {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`hs-dropdown relative inline-flex ${className}`}>
      <div className="hs-dropdown-toggle cursor-pointer">{trigger}</div>
      <div className="hs-dropdown-menu hs-dropdown-open:opacity-100 hidden opacity-0 transition-[opacity,margin] duration-300 z-10 min-w-40 rounded-[--radius-control] border border-line bg-surface p-1 shadow-[--shadow-float]">
        {children}
      </div>
    </div>
  );
}

export function DropdownItem({
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className="flex items-center gap-2 rounded-[--radius-control] px-3 py-2 text-sm text-ink hover:bg-canvas cursor-pointer"
      {...props}
    >
      {children}
    </a>
  );
}
