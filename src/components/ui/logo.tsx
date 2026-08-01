import Image from "next/image";

const ASPECT = 201 / 95;

/** The SILQU wordmark has dark navy text, so on a navy/dark surface it needs a light chip behind it. */
export function Logo({
  height = 28,
  onDark = false,
  className = "",
}: {
  height?: number;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center ${onDark ? "rounded-[--radius-control] bg-white px-2 py-1" : ""} ${className}`}
    >
      <Image
        src="/logo/logo.webp"
        alt="SILQU"
        width={Math.round(height * ASPECT)}
        height={height}
        priority
      />
    </span>
  );
}
