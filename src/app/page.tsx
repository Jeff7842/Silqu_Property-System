import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-page px-6 text-center">
      <h1 className="text-2xl font-bold text-ink font-[--font-display]">SILQU</h1>
      <p className="text-sm text-ink-muted">Rental property management for Kenyan landlords.</p>
      <Link href="/design-system" className="text-sm font-medium text-primary hover:underline">
        View the design system →
      </Link>
    </div>
  );
}
