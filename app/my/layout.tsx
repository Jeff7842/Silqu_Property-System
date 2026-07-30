import type { ReactNode } from "react";

// Scopes the forest-green token overrides in globals.css to every /my/*
// route (portal shell, login, accept-invite) — see the Stitch tenant
// screens (Tenant Home Dashboard etc.), a distinct Material-3 green
// palette from the business/platform navy-blue brand.
export default function TenantPortalLayout({ children }: { children: ReactNode }) {
  return <div data-portal="tenant">{children}</div>;
}
