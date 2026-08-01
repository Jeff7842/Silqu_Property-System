import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export const metadata: Metadata = { title: "Activate your account – SILQU" };

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-[--radius-card] border border-line bg-surface p-8 shadow-[--shadow-card]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo height={28} />
          <h1 className="text-2xl font-bold text-navy">Welcome</h1>
          <p className="text-sm text-ink-muted">
            Your property manager created a tenant account for you. Choose a password to activate it.
          </p>
        </div>
        <Suspense>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
