import type { Metadata } from "next";
import { SignupWizard } from "@/components/auth/signup-wizard";

export const metadata: Metadata = { title: "Sign up – SILQU" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel — marketing */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-navy p-8 text-white md:flex">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,45,82,0.9),rgba(15,45,82,0.95))]" />
        <div className="relative z-10 text-3xl font-black tracking-tight">SILQU</div>
        <div className="relative z-10 mt-auto max-w-md">
          <h2 className="text-4xl font-black leading-tight">
            Join the premier property management platform in Kenya.
          </h2>
          <p className="mt-4 text-base text-white/80">
            Automate your rent collection, manage tenants, and grow your business with ease.
          </p>
        </div>
        <div className="relative z-10 border-t border-white/10 pt-8 text-sm text-white/60">
          © 2026 SILQU. All rights reserved.
        </div>
      </div>

      {/* Right panel — wizard */}
      <div className="flex w-full flex-col items-center justify-center bg-canvas p-4 py-10 md:w-[55%]">
        <SignupWizard />
      </div>
    </div>
  );
}
