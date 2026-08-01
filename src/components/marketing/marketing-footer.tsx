import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Manager login" },
  { href: "/my/login", label: "Tenant login" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-navy text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <span className="text-xl font-black tracking-tight font-[--font-display]">SILQU</span>
          <p className="mt-3 text-sm text-white/70">
            Rental property management for Kenyan landlords and property managers : leases,
            M-Pesa rent collection and maintenance, in one place.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/50">
            Built in Kenya
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/80 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} SILQU. All rights reserved.
      </div>
    </footer>
  );
}
