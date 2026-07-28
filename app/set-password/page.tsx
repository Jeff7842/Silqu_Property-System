import type { Metadata } from "next";
import { Suspense } from "react";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const metadata: Metadata = { title: "Set password – SILQU" };

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-[--radius-card] border border-line bg-surface p-8 shadow-[--shadow-card]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-navy">Set a new password</h1>
        </div>
        <Suspense>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
