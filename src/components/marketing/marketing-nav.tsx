import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Public marketing nav : shared by the home, pricing and contact pages via
 * app/(marketing)/layout.tsx. Server Component: the mobile menu is Preline's
 * hs-collapse (data-attribute driven, re-initialised on route change by
 * PrelineClient), so no client-side state is needed here per rule 19.
 */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Logo height={26} />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-[--radius-control] px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-[--radius-control] bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Get started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-[--radius-control] p-2 text-ink md:hidden"
          data-hs-collapse="#marketing-mobile-menu"
          aria-controls="marketing-mobile-menu"
          aria-label="Toggle navigation menu"
        >
          <Icon name="menu" size={24} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div id="marketing-mobile-menu" className="hs-collapse hidden overflow-hidden transition-all duration-300 md:hidden">
        <div className="flex flex-col gap-1 border-t border-line bg-surface px-4 py-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[--radius-control] px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
            <Link
              href="/login"
              className="rounded-[--radius-control] px-3 py-2 text-center text-sm font-semibold text-ink hover:bg-canvas"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-[--radius-control] bg-primary px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
