import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PrelineClient from "@/components/ui/preline-client";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// Stitch design uses Inter exclusively : see docs/SILQU_BUILD_PLAN_V2.md's
// design-system section, now superseded by the Stitch project's designMd.
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "SILQU",
  description: "Rental property management for Kenyan landlords.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
        <PrelineClient />
      </body>
    </html>
  );
}
