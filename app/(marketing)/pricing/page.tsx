import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  title: "Pricing – SILQU",
  description: "Simple, transparent pricing for property managers in Kenya. 14-day free trial, no credit card required.",
};

const TIERS = [
  {
    name: "Starter",
    tagline: "Perfect for independent landlords.",
    price: "KES 1,500",
    period: "/mo",
    features: ["Up to 10 units", "Basic reporting", "Manual invoicing", "Email support"],
    cta: { label: "Start 14-day trial", href: "/signup" },
    highlighted: false,
  },
  {
    name: "Professional",
    tagline: "For growing property management agencies.",
    price: "KES 2,500",
    period: "/mo",
    features: [
      "Up to 50 units",
      "Advanced analytics",
      "Automated M-Pesa invoicing",
      "Tenant portal access",
      "Priority support",
    ],
    cta: { label: "Get started", href: "/signup" },
    highlighted: true,
  },
  {
    name: "Enterprise",
    tagline: "Tailored solutions for large portfolios.",
    price: "Custom",
    period: "",
    features: [
      "Unlimited units",
      "Custom integrations (API)",
      "Dedicated account manager",
      "On-premise deployment options",
    ],
    cta: { label: "Contact sales", href: "/contact" },
    highlighted: false,
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <section className="bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-ink font-[--font-display] sm:text-5xl">
            Honest pricing. No surprises.
          </h1>
          <p className="mt-5 text-lg text-ink-muted">
            Start managing your properties efficiently today. All plans include a 14-day free trial —
            no credit card required.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-[--radius-card] border bg-surface p-8 ${
                tier.highlighted
                  ? "border-2 border-primary shadow-[--shadow-float]"
                  : "border-line shadow-[--shadow-card]"
              }`}
            >
              {tier.highlighted && (
                <Badge tone="info">
                  Most popular
                </Badge>
              )}
              <h2 className="mt-3 text-xl font-semibold text-ink font-[--font-display]">{tier.name}</h2>
              <p className="mt-1 text-sm text-ink-muted">{tier.tagline}</p>
              <p className="mt-6 text-4xl font-bold text-ink font-[--font-display]">
                {tier.price}
                {tier.period && <span className="text-base font-normal text-ink-muted">{tier.period}</span>}
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-ink-muted">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.cta.href}
                className={`mt-8 block rounded-[--radius-control] py-2.5 text-center text-sm font-semibold transition-colors ${
                  tier.highlighted
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "border border-line text-ink hover:bg-canvas"
                }`}
              >
                {tier.cta.label}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-ink-muted">
          Paying annually saves 20% on the Starter and Professional plans — set up billing after your
          trial from your organization settings.
        </p>
      </section>

      <CtaBand />
    </>
  );
}
