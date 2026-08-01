import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

// Shared chrome for the public marketing routes (home, pricing, contact).
// Auth screens (login/signup) intentionally live outside this group : they
// use their own full-bleed split layout, not a nav+footer shell.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
