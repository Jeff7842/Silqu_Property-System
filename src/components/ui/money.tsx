import { fromCents } from "@/lib/money";

const TONE_CLASS = {
  default: "text-ink",
  positive: "text-success",
  negative: "text-danger",
} as const;

export function Money({
  cents,
  tone = "default",
  size = "body",
  showCurrency = true,
}: {
  cents: number;
  tone?: keyof typeof TONE_CLASS;
  size?: "body" | "metric" | "small";
  showCurrency?: boolean;
}) {
  const amount = fromCents(cents).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span
      className={`font-mono tabular-nums text-right whitespace-nowrap ${TONE_CLASS[tone]} ${
        size === "metric" ? "text-2xl" : size === "small" ? "text-sm" : "text-base"
      }`}
    >
      {showCurrency && <span className="text-ink-muted mr-1">KES</span>}
      {amount}
    </span>
  );
}
