# SILQU — Working Agreement

## Project
SILQU is a web-based rental property management system for small and medium
landlords and property managers in Kenya. Final Year Project II, KCA University.

## Read first
- docs/SILQU_BUILD_PLAN_V2.md  ← the authoritative build plan
- docs/SRS.pdf, docs/SDS.pdf, docs/TEST_PLAN.pdf

## Package manager
This project uses **pnpm**. Never use npm or yarn commands or lockfiles.
`pnpm add` for installs, `pnpm <script>` for package.json scripts, `pnpm dlx <pkg>`
in place of `npx <pkg>`.

## Stack
Next.js 14 App Router · TypeScript strict · Tailwind CSS v4 (CSS-first @theme) ·
Preline UI v4.2 · Iconify + Solar icon set · Neon Postgres · Prisma (Neon
driver adapter) · Auth.js v5 · Zod · react-hook-form · TanStack Table ·
ApexCharts · Upstash Redis · Upstash QStash · Cloudflare R2 · Resend ·
Safaricom Daraja (sandbox) · Go reports microservice · Vercel

## Three portals
1. Business  — app.silqu.co.ke      — MANAGER, EMPLOYEE, CARETAKER
2. Tenant    — my.silqu.co.ke       — TENANT
3. Platform  — platform.silqu.co.ke — PLATFORM_ADMIN, PLATFORM_SUPPORT
Separate layouts, themes, cookies, login pages and middleware rules.

## Non-negotiable rules
1. Money is ALWAYS Int cents in a column named *Cents. Never Float, Decimal or
   BigInt on a row column. Format only through <Money /> or lib/money.ts.
2. Every query is org-scoped. No page component writes a query; everything goes
   through src/server/db/queries/.
3. Every server action begins with requireRole(...) and re-validates input with
   the matching Zod schema.
4. Permission checks live on the server. Hiding UI is courtesy, not security.
5. Caretaker access is scoped by CaretakerAssignment in the query layer.
6. Portals never share a session cookie.
7. UI components come from Preline UI v4.2 first. Anything not in Preline is
   listed in build plan section 7.4. Run every Preline snippet through the
   token swap in section 7.2 — no stock Tailwind palette classes.
8. Icons come only from the ICONS registry in src/lib/icons.ts. Never write a
   raw "solar:..." string in a component. Run pnpm verify:icons after edits.
9. No hex codes in components. Tokens only, declared with @theme (not
   @theme inline).
10. Preline must be re-initialised on route change via usePathname().
11. Every /api/jobs/* route verifies its QStash signature.
12. Every job handler and every webhook handler is idempotent.
13. Redis is a cache and a counter, never a source of truth, and never holds
    personal data.
14. Private R2 objects are served only through short-lived signed URLs, and
    every fetch writes an AuditLog row.
15. Financial records are archived, never deleted.
16. All timestamps stored UTC, displayed Africa/Nairobi.
17. Never log or commit secrets, passwords, tokens or M-Pesa credentials.
18. Every mutation is followed by revalidatePath, a KPI cache bust, and a toast.
19. Server Components by default; "use client" only at the smallest leaf.

## Working style
- One phase per session. Never start the next phase unprompted.
- Show a plan before writing code. Wait for approval.
- Do not touch files outside the phase's stated scope without asking.
- Conventional commits: feat|fix|refactor|test|docs|chore(scope): message
- Every feature references its SRS requirement ID in the commit body.
- Write the test in the same commit as the feature.

## Copy style
Sentence case. Buttons name the action ("Record payment"). Errors say what
happened and what to do next. Kenyan context: County, Estate, Caretaker, KES,
M-Pesa code, +254 7XX XXX XXX.
