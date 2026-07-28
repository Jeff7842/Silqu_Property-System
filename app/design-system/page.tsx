"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal, ModalTrigger } from "@/components/ui/modal";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Icon } from "@/components/ui/icon";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-ink font-[--font-display]">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  const { push } = useToast();

  return (
    <div className="min-h-screen bg-page px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-ink font-[--font-display]">
            SILQU design system
          </h1>
          <p className="text-sm text-ink-muted">
            One unified navy/blue brand, sourced from the project&apos;s Stitch design.
          </p>
        </header>

        <Section title="Buttons">
          <Button variant="primary">Record payment</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
        </Section>

        <Section title="Inputs">
          <Input label="Tenant phone" placeholder="+254 7XX XXX XXX" prefix="+254" />
          <Input label="Rent" placeholder="0.00" prefix="KES" />
          <Input
            label="Email"
            defaultValue="not-an-email"
            error="That doesn't look like a valid email address."
          />
          <Input label="Disabled" disabled placeholder="Disabled" />
        </Section>

        <Section title="Select, textarea, checkbox, switch">
          <Select label="County" defaultValue="">
            <option value="" disabled>
              Choose a county
            </option>
            <option>Nairobi</option>
            <option>Mombasa</option>
            <option>Kisumu</option>
          </Select>
          <Textarea label="Description" placeholder="Describe the issue…" rows={3} />
          <Checkbox label="Send email notification" defaultChecked />
          <Switch label="Enabled" defaultChecked />
        </Section>

        <Section title="Badges">
          <Badge tone="success">Paid</Badge>
          <Badge tone="warning">Due soon</Badge>
          <Badge tone="danger">Overdue</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="neutral">Draft</Badge>
        </Section>

        <Section title="Money">
          <Money cents={1450000} />
          <Money cents={1450000} tone="positive" />
          <Money cents={-350000} tone="negative" />
          <Money cents={2000000} size="metric" />
        </Section>

        <Section title="Cards">
          <Card header={<h3 className="font-semibold text-ink">Property occupancy</h3>}>
            <p className="text-sm text-ink-muted">18 of 24 units occupied.</p>
          </Card>
        </Section>

        <Section title="Modal">
          <ModalTrigger
            targetId="demo-modal"
            className="inline-flex items-center justify-center rounded-[--radius-control] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Open modal
          </ModalTrigger>
          <Modal
            id="demo-modal"
            title="End lease"
            footer={
              <div className="flex justify-end gap-2">
                <ModalTrigger
                  targetId="demo-modal"
                  className="inline-flex items-center justify-center rounded-[--radius-control] border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
                >
                  Cancel
                </ModalTrigger>
                <Button variant="danger">End lease</Button>
              </div>
            }
          >
            <p className="text-sm text-ink-muted">
              This will free the unit and mark the lease as ended. This cannot be undone.
            </p>
          </Modal>
        </Section>

        <Section title="Dropdown">
          <Dropdown trigger={<Button variant="secondary">Row actions</Button>}>
            <DropdownItem href="#">Edit</DropdownItem>
            <DropdownItem href="#">Archive</DropdownItem>
          </Dropdown>
        </Section>

        <Section title="Toast">
          <Button variant="secondary" onClick={() => push("Payment recorded.", "success")}>
            Trigger success
          </Button>
          <Button variant="secondary" onClick={() => push("Could not reach M-Pesa.", "danger")}>
            Trigger error
          </Button>
        </Section>

        <Section title="Skeleton and spinner">
          <div className="flex w-64 flex-col gap-2">
            <Skeleton variant="text" />
            <Skeleton variant="table-row" />
            <Skeleton variant="card" />
          </div>
          <Spinner />
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon="emptyBuilding"
            title="No properties yet"
            description="Add your first property to start tracking units and rent."
            action={<Button variant="primary">Add property</Button>}
          />
        </Section>

        <Section title="Icons">
          <div className="flex flex-wrap gap-4">
            {(
              [
                "dashboard",
                "properties",
                "tenants",
                "invoices",
                "payments",
                "arrears",
                "maintenance",
                "settings",
              ] as const
            ).map((name) => (
              <div key={name} className="flex flex-col items-center gap-1 text-xs text-ink-muted">
                <Icon name={name} />
                {name}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
