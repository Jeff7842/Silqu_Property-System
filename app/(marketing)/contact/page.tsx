import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/marketing/contact-form";
import type { IconName } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Contact – SILQU",
  description: "Get in touch with the SILQU team : general inquiries, technical support and billing questions.",
};

const CONTACT_CARDS: { icon: IconName; title: string; description: string; detail: string }[] = [
  {
    icon: "email",
    title: "Email us",
    description: "For general inquiries and support requests.",
    detail: "support@silqu.co.ke",
  },
  {
    icon: "phone",
    title: "Call us",
    description: "Available Mon–Fri, 8am to 6pm EAT.",
    detail: "+254 700 000 000",
  },
  {
    icon: "location",
    title: "Headquarters",
    description: "Come say hello in person.",
    detail: "Nairobi, Kenya",
  },
  {
    icon: "timer",
    title: "Fast support",
    description: "Average response time is under 4 hours during business days.",
    detail: "",
  },
];

export default function ContactPage() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-ink font-[--font-display] sm:text-5xl">Get in touch</h1>
          <p className="mt-5 text-lg text-ink-muted">
            We're here to help you optimise your property management. Reach out to our dedicated
            support team.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-4">
            {CONTACT_CARDS.map((card) => (
              <Card key={card.title}>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[--radius-control] bg-primary/10">
                    <Icon name={card.icon} size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{card.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{card.description}</p>
                    {card.detail && <p className="mt-1 text-sm font-medium text-primary">{card.detail}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card padded={false}>
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-ink font-[--font-display]">Send us a message</h2>
              <p className="mt-1 text-sm text-ink-muted">We'll reply to the email address you provide.</p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
