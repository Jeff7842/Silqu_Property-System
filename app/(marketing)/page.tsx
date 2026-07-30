import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { CtaBand } from "@/components/marketing/cta-band";
import type { IconName } from "@/lib/icons";

export const metadata: Metadata = {
  title: "SILQU – Property management for Kenyan landlords",
  description:
    "The all-in-one platform to track leases, collect rent via M-Pesa, and manage maintenance requests.",
};

const STATS = [
  { value: "200+", label: "Properties managed" },
  { value: "KES 50M+", label: "Rent collected" },
  { value: "5,000+", label: "Active tenants" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Local support" },
] as const;

const FEATURES: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "invoices",
    title: "Automated invoicing",
    description:
      "Generate and send professional rent invoices automatically on the 1st of every month, by SMS and email.",
  },
  {
    icon: "mpesa",
    title: "M-Pesa integration",
    description:
      "Real-time reconciliation. Tenants pay by STK push, and ledgers update instantly with no manual data entry.",
  },
  {
    icon: "arrears",
    title: "Arrears tracking",
    description:
      "Spot who's behind on rent instantly. Send automated, polite reminders before resorting to penalties.",
  },
  {
    icon: "tenants",
    title: "Tenant portal",
    description:
      "Give tenants a self-service view to check their balance, download receipts, and log maintenance requests.",
  },
  {
    icon: "reports",
    title: "Financial reports",
    description:
      "Generate P&L statements, tax-ready summaries and occupancy reports in one click. Export to PDF or CSV.",
  },
  {
    icon: "shield",
    title: "Bank-grade security",
    description:
      "Your financial data is encrypted and backed up daily. Role-based access means staff only see what they need.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Sign up & configure",
    description: "Create your account and link your preferred receiving bank account or M-Pesa paybill.",
  },
  {
    number: "02",
    title: "Add properties & tenants",
    description: "Bulk-upload your current tenant roll, lease agreements and outstanding balances.",
  },
  {
    number: "03",
    title: "Collect & report",
    description: "Let SILQU handle invoicing and collections while you monitor the dashboard.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Before SILQU, end of month was a nightmare of bank statements and M-Pesa messages. Now the system reconciles automatically — it's saved me hours of admin work.",
    name: "David Kiprono",
    role: "Nairobi West Properties",
  },
  {
    quote:
      "The automated arrears tracking is brilliant. My tenants get polite SMS reminders, and my collection rate has improved from 70% to 95% by the 5th of every month.",
    name: "Grace Omondi",
    role: "Real estate agent, Kisumu",
  },
  {
    quote:
      "I manage properties while living abroad. The reports give me complete peace of mind, knowing exactly what's been collected and what's pending at any time.",
    name: "Peter Mutua",
    role: "Diaspora investor",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-ink font-[--font-display] sm:text-5xl">
              Manage your properties. Get paid. Stay in control.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              The all-in-one platform to track leases, collect rent seamlessly via M-Pesa, and manage
              maintenance requests. Professionalise your property portfolio today.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-[--radius-control] bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Start free trial
                <Icon name="arrowForward" size={18} />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-[--radius-control] border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              app.silqu.co.ke &middot; no credit card required for your 14-day trial
            </p>
          </div>

          {/* Dashboard preview mock */}
          <div className="rounded-[--radius-card] border border-line bg-surface p-5 shadow-[--shadow-float]">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-sm text-ink-muted">Welcome back,</p>
                <p className="font-semibold text-ink">Jefferson</p>
              </div>
              <Badge tone="success">Live dashboard</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Collected this month
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <Money cents={120000000} size="metric" />
                  <span className="text-xs font-semibold text-success">+12%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Occupancy</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">94%</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Recent M-Pesa payments
              </p>
              {[
                { name: "John Doe", cents: 3500000 },
                { name: "Mary Kamau", cents: 2800000 },
                { name: "Eric Wafula", cents: 4200000 },
              ].map((payment) => (
                <div key={payment.name} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{payment.name}</span>
                  <Money cents={payment.cents} size="small" tone="positive" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof stats */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-5 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-navy font-[--font-display] sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-ink-muted sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink font-[--font-display] sm:text-4xl">
            Everything you need to run your portfolio
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            From rent collection to reporting, SILQU replaces the spreadsheets and paper trail with one
            connected system.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[--radius-card] border border-line bg-surface p-6 shadow-[--shadow-card]"
            >
              <div className="flex size-11 items-center justify-center rounded-[--radius-control] bg-primary/10">
                <Icon name={feature.icon} size={22} className="text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-ink font-[--font-display] sm:text-4xl">
              Up and running in three steps
            </h2>
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <span className="text-4xl font-bold text-primary/30 font-[--font-display]">
                  {step.number}
                </span>
                <h3 className="mt-2 font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink font-[--font-display] sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Pay only for what you use. No hidden setup fees.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          <div className="rounded-[--radius-card] border border-line bg-surface p-6 shadow-[--shadow-card]">
            <h3 className="font-semibold text-ink">Monthly</h3>
            <p className="mt-2 text-3xl font-bold text-ink font-[--font-display]">
              KES 2,500<span className="text-base font-normal text-ink-muted">/mo</span>
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-muted">
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Up to 50 units
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Automated SMS invoicing
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Basic reporting
              </li>
            </ul>
            <Link
              href="/pricing"
              className="mt-6 block rounded-[--radius-control] border border-line py-2.5 text-center text-sm font-semibold text-ink transition-colors hover:bg-canvas"
            >
              Choose monthly
            </Link>
          </div>
          <div className="relative rounded-[--radius-card] border-2 border-primary bg-surface p-6 shadow-[--shadow-float]">
            <Badge tone="info">Save 20%</Badge>
            <h3 className="mt-3 font-semibold text-ink">Annual</h3>
            <p className="mt-2 text-3xl font-bold text-ink font-[--font-display]">
              KES 24,000<span className="text-base font-normal text-ink-muted">/yr</span>
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-muted">
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Everything in monthly
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Unlimited units
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Advanced M-Pesa analytics
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Priority support
              </li>
            </ul>
            <Link
              href="/pricing"
              className="mt-6 block rounded-[--radius-control] bg-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Get started now
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            See the full plan comparison, including Enterprise →
          </Link>
        </p>
      </section>

      {/* Testimonials */}
      <section className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-ink font-[--font-display] sm:text-4xl">
            Trusted by landlords and agencies across Kenya
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.name}
                className="flex flex-col rounded-[--radius-card] border border-line bg-surface p-6 shadow-[--shadow-card]"
              >
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" size={16} />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm text-ink-muted">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
                  <p className="text-xs text-ink-muted">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
