import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { BusinessLoginForm } from "@/components/auth/business-login-form";
import Image from 'next/image';

export const metadata: Metadata = { title: "Sign in – SILQU" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel : marketing. "Updated Background" per the Stitch screen:
          soft token-based glow instead of a flat fill, no external image
          (the Stitch project's photo asset is served from a signed,
          expiring Google URL : not safe to hotlink from production). */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-navy p-8 text-white md:flex">
  {/* Layer 1 (bottom): the actual photo, filling the whole panel */}
  <div className="absolute inset-0 bg-[url('/image/building.png')] bg-cover bg-center bg-no-repeat w-full h-full" />

  {/* Layer 2: ambient glow blobs — now sit ON the photo, not INSTEAD of it*/} 
  <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-accent/30 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-accent/20 blur-3xl" />

  {/* Layer 3: navy → near-black gradient, darkens the photo so white text stays readable*/} 
  <div className="absolute inset-0 bg-linear-to-b from-navy/0 via-navy/70 to-[#020617]/95" />

  {/* Layer 4 (top): real content — unchanged */}
  <div className="relative z-10 flex flex-col">
    <Image
        src="/logo/logo.webp"
        alt="SILQU"
        width={100}
        height={100}
        priority
      />
  </div>

  <div className="relative z-10 mt-auto flex flex-col gap-6">
    <h2 className="text-4xl font-black leading-tight">Manage smarter.</h2>
    <p className="max-w-md text-base text-white/80">
      The modern, authoritative platform for high-performance property management.
    </p>
    <ul className="mt-2 flex flex-col gap-2">
      {[
        "Automated invoicing & reconciliation",
        "Real-time M-Pesa transaction tracking",
        "Comprehensive arrears reporting",
      ].map((item) => (
        <li key={item} className="flex items-center gap-2">
          <Icon name="success" size={18} className="text-accent" />
          <span className="text-white/90">{item}</span>
        </li>
      ))}
    </ul>
  </div>

  <div className="relative z-10 border-t border-white/10 pt-8">
    <p className="text-sm text-white/60">
      New to SILQU?{" "}
      <Link href="/signup" className="font-semibold text-accent hover:underline">
        Create an account
      </Link>
    </p>
  </div>
</div>

      {/* Right panel : form */}
      <div className="flex w-full flex-col items-center justify-center bg-canvas p-4 md:w-[55%]">
        <div className="mb-6 md:hidden">
          <Logo height={28} />
        </div>
        <div className="w-full max-w-md rounded-[--radius-card] border border-line bg-surface p-6 shadow-[--shadow-card] lg:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-muted">Log in to your manager dashboard</p>
          </div>
          <BusinessLoginForm />
          <p className="mt-6 text-center text-sm text-ink-muted">
            Are you a tenant?{" "}
            <Link href="/my/login" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              Tenant Login <Icon name="arrowForward" size={16} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
