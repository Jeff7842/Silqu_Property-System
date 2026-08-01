import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { TenantLoginForm } from "@/components/auth/tenant-login-form";

export const metadata: Metadata = { title: "Tenant sign in – SILQU" };

export default function TenantLoginPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel : marketing. Token-based glow, same treatment as the
          business login page, forest-green here via [data-portal="tenant"]. */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-navy p-8 text-white md:flex">
        <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-b from-navy/85 to-navy/95" />
        <div className="relative z-10 flex flex-col">
          <Logo height={32} onDark />
        </div>
        <div className="relative z-10 mt-auto flex flex-col gap-6">
          <h2 className="text-4xl font-black leading-tight">Your home, in one place.</h2>
          <p className="max-w-md text-base text-white/80">
            View your lease, pay rent by M-Pesa, and reach your caretaker without leaving the app.
          </p>
        </div>
        <div className="relative z-10 border-t border-white/10 pt-8">
          <p className="text-sm text-white/60">
            Are you a property manager?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Manager login
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel : form */}
      <div className="flex w-full flex-col items-center justify-center bg-canvas p-4 md:w-[55%]">
        <div className="w-full max-w-md rounded-[--radius-card] border border-line bg-surface shadow-[--shadow-card] overflow-hidden">
          <div className="flex flex-col items-center gap-3 border-b border-line bg-canvas/50 px-8 pb-6 pt-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
              <Icon name="home" size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-navy">Tenant Portal</h1>
            <p className="text-sm text-ink-muted">Sign in to manage your leases and payments.</p>
          </div>
          <div className="flex flex-col gap-6 p-8">
            <TenantLoginForm />
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Or</span>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="flex gap-3 rounded-[--radius-control] border border-info/30 bg-info/5 p-4">
              <Icon name="info" size={20} className="mt-0.5 shrink-0 text-info" />
              <div>
                <h4 className="text-sm font-semibold text-ink">New tenant?</h4>
                <p className="mt-1 text-sm text-ink-muted">
                  Your account is automatically created when your property manager issues a lease.
                  Check your email for the welcome link to set your password.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
