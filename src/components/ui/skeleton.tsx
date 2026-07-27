export function Skeleton({
  variant = "text",
  className = "",
}: {
  variant?: "text" | "card" | "table-row";
  className?: string;
}) {
  const base = "animate-pulse rounded-[--radius-control] bg-line/60";
  const variantClass = {
    text: "h-4 w-full",
    card: "h-32 w-full rounded-[--radius-card]",
    "table-row": "h-10 w-full",
  }[variant];

  return <div className={`${base} ${variantClass} ${className}`} />;
}
