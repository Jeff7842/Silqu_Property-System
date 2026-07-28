import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password – SILQU" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-[--radius-card] border border-line bg-surface p-8 shadow-[--shadow-card]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-navy">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter the email on your account and we&apos;ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
