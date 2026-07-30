import Link from "next/link";
import { Icon } from "@/components/ui/icon";

/**
 * Final call-to-action band, reused at the bottom of the home and pricing
 * pages so the "start free trial" ask is consistent across the funnel.
 */
export function CtaBand() {
  return (
    <section className="bg-navy">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white font-[--font-display] sm:text-4xl">
          Ready to professionalise your portfolio?
        </h2>
        <p className="max-w-xl text-base text-white/80">
          Start your 14-day free trial today. No credit card required, cancel anytime.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-[--radius-control] bg-accent px-6 py-3 text-sm font-semibold text-navy transition-colors hover:brightness-95"
          >
            Start free trial
            <Icon name="arrowForward" size={18} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-[--radius-control] border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}
