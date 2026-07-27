"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  createManagerAccountAction,
  activateSubscriptionStubAction,
  type SignUpState,
} from "@/server/actions/signup.actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const STEPS = ["Account Details", "Activate Subscription", "Check Your Email"] as const;

function Stepper({ step }: { step: number }) {
  return (
    <div className="mx-auto mb-8 flex w-full max-w-md items-center justify-between">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${
                done || active ? "bg-primary text-white" : "bg-line text-ink-muted"
              }`}
            >
              {done ? <Icon name="check" size={16} /> : n}
            </div>
            <span
              className={`hidden text-center text-[11px] font-semibold uppercase tracking-wide sm:block ${
                active ? "text-primary" : "text-ink-muted"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SignupWizard() {
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<SignUpState, FormData>(
    async (prevState, formData) => {
      const result = await createManagerAccountAction(prevState, formData);
      if (result?.orgId) {
        setOrgId(result.orgId);
        setStep(2);
      }
      return result;
    },
    undefined,
  );
  const [activating, startActivating] = useTransition();

  return (
    <div className="w-full max-w-xl">
      <Stepper step={step} />

      {step === 1 && (
        <div className="rounded-[--radius-card] border border-line bg-surface p-6 shadow-[--shadow-float] lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary">Create your account</h1>
            <p className="text-sm text-ink-muted">Join the community of property experts.</p>
          </div>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="First Name" name="firstName" placeholder="Jefferson" required />
              <Input label="Last Name" name="lastName" placeholder="Kimotho" required />
              <div className="md:col-span-2">
                <Input
                  label="Estate / Company Name"
                  name="organizationName"
                  placeholder="Sunset Ridge Properties"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="jefferson@example.com"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  prefix="+254"
                  placeholder="712 345 678"
                  required
                />
              </div>
              <Select label="County" name="county" defaultValue="Nairobi">
                <option>Nairobi</option>
                <option>Mombasa</option>
                <option>Kisumu</option>
              </Select>
              <PasswordInput label="Password" name="password" placeholder="At least 8 characters" required />
            </div>
            {state?.error && <p className="text-sm text-danger">{state.error}</p>}
            <Button type="submit" loading={pending} className="mt-2 w-full">
              Continue to Subscription
              <Icon name="arrowForward" size={18} />
            </Button>
            <p className="text-center text-sm text-ink-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </form>
        </div>
      )}

      {step === 2 && orgId && (
        <div className="rounded-[--radius-card] border border-line bg-surface p-6 py-16 text-center shadow-[--shadow-float] lg:p-8">
          <h2 className="mb-2 text-2xl font-bold text-primary">Activate Subscription</h2>
          <p className="mb-6 text-sm text-ink-muted">
            KES 2,500/month · up to 50 units · M-Pesa payment integration arrives in a later phase.
          </p>
          <Button
            loading={activating}
            onClick={() => startActivating(async () => {
              await activateSubscriptionStubAction(orgId);
              setStep(3);
            })}
          >
            Complete Payment (Demo)
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-[--radius-card] border border-line bg-surface p-6 py-16 text-center shadow-[--shadow-float] lg:p-8">
          <Icon name="email" size={64} className="mx-auto mb-4 text-primary" />
          <h2 className="mb-2 text-2xl font-bold text-primary">Check Your Email</h2>
          <p className="mb-6 text-sm text-ink-muted">
            We&apos;ve sent a welcome email to your inbox. Your account is ready — sign in whenever
            you like.
          </p>
          <Link href="/login">
            <Button>Go to sign in</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
