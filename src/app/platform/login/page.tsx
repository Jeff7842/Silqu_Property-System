import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PlatformLoginForm } from "@/components/auth/platform-login-form";

export const metadata: Metadata = { title: "Platform sign in – SILQU" };

export default function PlatformLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <div className="w-full max-w-md rounded-[--radius-card] border border-white/10 bg-surface p-6 shadow-[--shadow-float] lg:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <Icon name="shield" size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-navy">SILQU Platform</h1>
          <p className="text-sm text-ink-muted">Internal access only. Restricted to platform staff.</p>
        </div>
        <PlatformLoginForm />
        <p className="mt-6 text-center text-xs text-ink-muted">
          Not platform staff?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Manager login
          </Link>
        </p>
      </div>
    </div>
  );
}
