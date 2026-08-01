# SILQU : Rental Property Management System
## Master Build Plan for Claude Code : v2.0 (Three Portals)

**Project:** SILQU Rental Property Management System
**Student:** Muchiri Jefferson Kimotho : ADM 23/06135
**Programme:** Bachelor of Information Technology, KCA University
**Unit:** BIT-04205 : Final Programming Project II
**Supervisor:** Issac Okola
**Version:** 2.0 : supersedes v1.0 entirely
**Purpose:** The single source of truth Claude Code reads before writing any SILQU code.

---

## CHANGE LOG : WHAT CHANGED FROM v1.0 AND WHY

| # | v1.0 | v2.0 | Reason |
|---|---|---|---|
| 1 | Drizzle ORM | **Prisma ORM** | Your call. Prisma's schema file doubles as readable documentation for your SDS chapter, and `prisma studio` is a better demo tool. Trade-offs are documented in §1.4 so you can defend the choice. |
| 2 | Iconify + Lucide set | **Iconify + Solar set** | See the correction note below. |
| 3 | Two portals + an admin area | **Three first-class portals** with separate subdomains, themes and login doors | Business / Platform (developer) / Tenant |
| 4 | Vercel Cron | **Upstash QStash** | Real queue: retries, exponential backoff, dead-letter queue, fan-out. Cron cannot retry a failed invoice run. |
| 5 | (none) | **Upstash Redis** | Rate limiting, caching, idempotency keys, distributed locks, STK status polling |
| 6 | Cloudflare R2 | **Cloudflare R2** (expanded) | Now with private buckets + signed reads for tenant ID documents |
| 7 | Radix UI primitives | **Preline UI v4.2** | Your call. Preline gives you 60+ prebuilt Tailwind components; anything missing is sourced outside and listed in §7.4 |
| 8 | Tailwind v3 + `tailwind.config.ts` | **Tailwind CSS v4 + CSS-first `@theme`** | Forced by Preline v4.2 : it ships `@source`, `@import`, `@plugin` and `@custom-variant` directives, which are Tailwind v4 syntax |

### A small but important correction

You asked to *"use Iconify instead of Lucide."* These are not alternatives to each other : they sit at different layers:

- **Iconify** is the *delivery system*: one React package (`@iconify/react`) that can fetch icons from 200+ icon sets on demand.
- **Lucide** is one *icon set* that Iconify serves, addressed as `lucide:building-2`.

So v1.0 already used Iconify; Lucide was just the set it pointed at. What you actually want is **a different icon set through Iconify**, and I have switched you to **Solar** (`solar:` prefix, 7,400+ icons, six styles: `linear`, `line-duotone`, `bold`, `bold-duotone`, `broken`, `outline`).

Solar is the better fit anyway: its **bold-duotone** style renders as two tones, which lets a single icon carry both your navy and your gold with no extra work. That is a genuine design win for a two-colour brand, not a preference. Full mapping and a verification script are in §2.6.

---

## 0. HOW TO USE THIS DOCUMENT

### 0.1 The mental model

Building software is like building a house. You do not hang curtains before there is a roof. Each of the ten phases below is one floor, and each floor rests on the one under it.

This document is the **architect's drawing set**. Claude Code is the builder. A builder without drawings guesses; a builder with drawings executes. Your job is to keep the drawings true and hand over **one floor at a time**.

### 0.2 The rule that saves the most pain

> **One phase per session. One feature per commit. Never let Claude Code "just also add" something.**

Scope bleed inside a session is how student projects die. You ask for a login page, the AI also builds a dashboard and half a payment form, nothing is tested, and now you cannot tell which part broke.

### 0.3 Session opener : paste this every time

```
Read CLAUDE.md and docs/SILQU_BUILD_PLAN_V2.md before doing anything.
We are working on Phase <N> only. Do not start Phase <N+1>.
Do not modify files outside the "Files this phase touches" list without asking me.
UI components come from Preline UI v4.2 first; only source outside Preline for
things in section 7.4. Icons come from the registry in src/lib/icons.ts.
Stop and show me a plan before writing any code.
```

Then paste that phase's **Claude Code prompt**.

### 0.4 Document map

| Section | Contents |
|---|---|
| 1 | Architecture : the why behind every tool |
| 2 | Design system : tokens, type, Solar icons, Tailwind v4 setup |
| 3 | **The three portals** : routing, subdomains, themes |
| 4 | File and folder structure |
| 5 | Data model : Prisma schema design |
| 6 | Roles and permissions across three portals |
| 7 | **Preline UI component mapping** + what to source outside |
| 8 | Infrastructure : Redis, QStash, R2 |
| 9 | **The 10 phases** |
| 10 | Environment variables |
| 11 | Mistakes ledger |
| 12 | `CLAUDE.md` starter |
| 13 | Schedule and quick reference |

---

## 1. ARCHITECTURE

### 1.1 The whole system, explained to a five-year-old

SILQU is a **shop with three doors**.

- The **shopfront** is what people see : the Next.js frontend. Pretty, fast, and it never touches the money box.
- The **shopkeeper behind the counter** is the backend : Server Actions, API routes, and a small Go helper. He checks whether you are allowed to ask before he does anything.
- The **stockroom** is the database (Neon Postgres). Nobody enters it except the shopkeeper.
- **Three doors** because three different kinds of people come: the *landlord and his staff*, the *tenants*, and *you, the developer who owns the building*. Each door opens into a different room. None of them connects to another.
- **M-Pesa** is the bank across the street. Your shopkeeper phones them; they phone back later.
- **The back office** (Redis and QStash) is a notebook and a to-do list. Redis is the notebook the shopkeeper keeps on the counter for things he needs to remember for a few minutes. QStash is the to-do list of jobs that must happen later, and that must be retried if they fail.

A customer must never walk straight into the stockroom. That sentence is the entire justification for authentication, the application layer, and role-based access control.

### 1.2 The stack

| Layer | Choice | Why this one |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | One codebase for UI and API. Server Components query the database on the server; the browser never sees a connection string. |
| Language | **TypeScript (strict)** | A spell-checker for code. Catches `invoice.total` vs `invoice.totalCents` at typing time, not at 2 a.m. before the defence. |
| Styling | **Tailwind CSS v4** | CSS-first configuration via `@theme`. Required by Preline v4.2. |
| Components | **Preline UI v4.2** | 60+ prebuilt Tailwind components with real JS plugins. Free, open source, Figma file available. |
| Icons | **Iconify + Solar set** | One package, on-demand loading, duotone styles that carry navy + gold. |
| Database | **Neon (Serverless Postgres)** | Postgres gives you the ACID guarantees and joins your proposal defends. Neon adds database branching : a copy of your DB per Git branch. |
| ORM | **Prisma** | Schema file is human-readable documentation. `prisma studio` is an excellent demo aid. Trade-offs in §1.4. |
| Auth | **Auth.js v5 (Credentials + JWT)** | You own authentication now, which means you can explain every step under questioning. |
| Hashing | **bcrypt (cost 12)** | Already your documented decision. Keep it. |
| Validation | **Zod** | One schema validates the browser form *and* the server payload. |
| Forms | **react-hook-form** + Zod resolver | Preline gives you the markup; RHF gives you the state. |
| Cache / limits | **Upstash Redis** | Rate limiting, KPI caching, idempotency keys, distributed locks. |
| Jobs / queue | **Upstash QStash** | Scheduled *and* queued HTTP jobs with retries and a dead-letter queue. |
| File storage | **Cloudflare R2** | S3-compatible, no egress fees. Public bucket for property photos, **private** bucket for tenant ID documents. |
| Email | **Resend** + React Email | Invitations, temp passwords, receipts, arrears reminders. |
| Payments | **Safaricom Daraja : STK Push** | Subscription at manager sign-up; rent payment in the tenant portal. |
| Charts | **ApexCharts** (Preline's charting plugin) | Stays inside the Preline ecosystem. |
| Tables | **TanStack Table** (headless) + Preline table markup | Deliberately *not* Preline Datatables : see §7.4. |
| Reports service | **Go microservice** on Fly.io / Render | The concurrency claim in your proposal, made real and small. |
| Hosting | **Vercel** | Zero-config Next.js, preview URL per PR. |
| Testing | **Vitest** + **Playwright** | Maps onto the 25 cases in your Test Plan. |

### 1.3 Four decisions you must be able to defend out loud

**Decision 1 : Money is stored as integers, never as decimals.**
`14500.00` in a floating-point number is not exactly 14,500.00. Repeat that arithmetic a few thousand times and an arrears report is wrong by shillings with no traceable cause. So every money column is an integer of **cents**, named `*Cents`. KES 14,500 is stored as `1450000`. Formatting happens once, at the very last moment, in `<Money />`. This is what every payments engineer does.

**Decision 2 : Multi-tenancy is enforced in a data-access layer, not in each page.**
Every property, unit, tenant and invoice belongs to an `Organization`. If one query anywhere forgets its org filter, one landlord sees another landlord's tenants : a Data Protection Act, 2019 breach, not a bug. **No page component ever writes a query.** Everything goes through `src/server/db/queries/*`, where the scope is applied once and tested once.

**Decision 3 : Three portals are three separate applications that happen to share a database.**
Not three menus in one app. Separate route groups, separate layouts, separate themes, separate login doors, separate middleware rules, separate session cookie names. A tenant session must be structurally incapable of rendering a platform page. This is defence in depth, and it is the single most impressive architectural point you can make in a viva.

**Decision 4 : Anything that can fail and must not be lost goes on a queue.**
Generating 200 invoices inside an HTTP request means a timeout leaves you half-billed. Emailing 200 receipts synchronously means one bad address kills the batch. QStash takes the job, retries it with backoff, and drops it into a dead-letter queue if it keeps failing : where you can see it and fix it. Cron cannot do that.

### 1.4 Prisma : the honest trade-offs

You chose Prisma. It is a good choice, and here is the balanced case so you can answer the examiner who asks "why not raw SQL?"

**What Prisma gives you**
- `schema.prisma` is a single readable file that *is* your data dictionary. Paste it straight into your SDS chapter.
- Generated TypeScript types mean a renamed column becomes a compile error, not a runtime surprise.
- `prisma migrate` gives you versioned, committed, reproducible schema history.
- `prisma studio` is a clean visual browser : genuinely useful during your demo.
- Relation queries (`include`, `select`) are readable to someone who has never seen an ORM.

**What Prisma costs you, and how we mitigate it**

| Cost | Mitigation |
|---|---|
| It hides the SQL, so you learn less about query performance | Enable query logging in dev (`log: ['query']`) and read what it generates. Run `EXPLAIN ANALYZE` on the slow ones in Phase 10. |
| Serverless connection exhaustion : each function instance opens a pool | Use the **Neon driver adapter** (`@prisma/adapter-neon`) over the pooled connection string, plus a global client singleton. |
| No partial unique indexes in the schema DSL | The `one ACTIVE lease per unit` index goes in a **hand-written migration SQL file**. Documented in §5.5. |
| `BigInt` does not serialise to JSON, and cannot cross the Server→Client boundary in React | Use `Int` for per-row money (see §5.3) and a `toMoney()` boundary helper. |
| Interactive transactions default to a 5-second timeout | Pass `{ maxWait, timeout }` explicitly on bulk operations. Bites you in Phase 7. |
| The generated client is large | It stays server-side. Never import `@prisma/client` into a Client Component. |

**Prisma + Neon setup (the part people get wrong)**

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")          // POOLED : used by the app
  directUrl = env("DATABASE_URL_UNPOOLED") // DIRECT : used by migrations
}
```

`url` must be the pooled Neon string or serverless functions will exhaust connections. `directUrl` must be the unpooled string or migrations will fail. Getting these the wrong way round produces confusing errors, so write a comment next to them.

---

## 2. DESIGN SYSTEM

### 2.1 The brief in one sentence

SILQU is a **ledger you can trust**, used by a Kenyan property manager standing in a corridor on a phone and by the same person at a desk at month-end.

That drives everything: calm, dense with numbers, never ambiguous about money. The **signature move** is the ledger treatment : every money figure in the entire product is monospaced, right-aligned, with a muted `KES` prefix, so shillings line up digit-for-digit down a column. Nothing else in the UI shouts. That one detail makes SILQU read as accounting-grade rather than generic admin template.

### 2.2 Tailwind v4 : the setup Preline forces, and why it is better

Preline v4.2 ships Tailwind v4 syntax (`@source`, `@import`, `@plugin`, `@custom-variant`). Tailwind v4 replaces `tailwind.config.ts` with **CSS-first configuration**: you declare your design tokens inside an `@theme` block in your stylesheet, and Tailwind generates the utility classes from them.

This is a genuine improvement for your project. Your token table below becomes literal CSS, in one file, and `bg-navy-700` exists because you declared `--color-navy-700`. There is no second config file to drift out of sync.

`src/app/globals.css`:

```css
@import "tailwindcss";

/* Preline UI : must come after the tailwindcss import */
@source "../../node_modules/preline/dist/*.js";
@import "../../node_modules/preline/variants.css";

/* Tailwind Forms plugin : required by all Preline form components */
@plugin "@tailwindcss/forms";

/* ---------------------------------------------------------------
   SILQU DESIGN TOKENS
   Declared with @theme (NOT @theme inline) so the generated
   utilities compile to var(--color-x). That is what lets a portal
   override a token at runtime and re-skin every component at once.
   --------------------------------------------------------------- */
@theme {
  /* Brand : navy */
  --color-navy-900: #0B2942;
  --color-navy-700: #14527A;
  --color-navy-500: #2E7BAE;
  --color-navy-100: #E6F0F7;

  /* Brand : gold */
  --color-gold-700: #A6701A;
  --color-gold-500: #E9A227;
  --color-gold-300: #F7C96B;

  /* Neutrals */
  --color-ink:        #0F1E2B;
  --color-ink-muted:  #5A6B7C;
  --color-line:       #E3E8EE;
  --color-surface:    #FFFFFF;
  --color-canvas:     #F6F8FA;

  /* Semantic */
  --color-success: #1E874B;
  --color-warning: #C77700;
  --color-danger:  #C0392B;
  --color-info:    #2E75B6;

  /* Semantic aliases : these are what portals re-point */
  --color-primary:       var(--color-navy-700);
  --color-primary-hover: var(--color-navy-900);
  --color-accent:        var(--color-gold-500);
  --color-page:          var(--color-canvas);

  /* Type */
  --font-display: "Sora", ui-sans-serif, system-ui, sans-serif;
  --font-body:    "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "IBM Plex Mono", ui-monospace, monospace;

  /* Radius */
  --radius-control: 8px;
  --radius-card:    12px;

  /* Elevation : exactly three levels, never invent a fourth */
  --shadow-card:  0 1px 2px rgba(15,30,43,.06);
  --shadow-float: 0 8px 24px rgba(15,30,43,.10);
}

/* ---- Portal themes: re-point the aliases, nothing else ---- */
[data-portal="tenant"] {
  --color-primary:       #14532D;   /* forest green */
  --color-primary-hover: #1F7A4C;
  --color-accent:        #C98A2B;
  --color-page:          #FBF7EE;   /* warm cream */
}

[data-portal="platform"] {
  --color-primary:       #0B2942;
  --color-primary-hover: #14527A;
  --color-accent:        #E9A227;
  --color-page:          #0F1E2B;   /* dark ops shell */
  --color-surface:       #16293A;
  --color-ink:           #E8EEF4;
  --color-ink-muted:     #8FA3B5;
  --color-line:          #24394D;
}

/* Preline's opinionated base styles, kept deliberately */
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) { cursor: pointer; }
}
@custom-variant hover (&:hover);

/* Focus ring : every interactive element, no exceptions */
@layer base {
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}
```

> **Beginner note : why `@theme` and not `@theme inline`?** With plain `@theme`, the class `bg-primary` compiles to `background-color: var(--color-primary)`. Because it still points at the variable, redefining that variable under `[data-portal="tenant"]` re-skins every button in the tenant portal instantly. With `@theme inline`, Tailwind bakes the literal hex into the class and portal theming stops working. One word, whole feature.

### 2.3 Colour reference

**Core brand : Business portal**

| Token | Hex | Used for |
|---|---|---|
| `navy-900` | `#0B2942` | Sidebar, darkest text |
| `navy-700` | `#14527A` | **Primary.** Buttons, active nav, links |
| `navy-500` | `#2E7BAE` | Hover, chart series 1 |
| `navy-100` | `#E6F0F7` | Selected row tint, info banner |
| `gold-500` | `#E9A227` | **Accent.** Arrears rail, KPI underline, focus ring |
| `gold-300` | `#F7C96B` | Chart series 2, badge fill |
| `gold-700` | `#A6701A` | Gold text on light (contrast-safe) |

**Neutrals:** `ink #0F1E2B` · `ink-muted #5A6B7C` · `line #E3E8EE` · `surface #FFFFFF` · `canvas #F6F8FA`

**Semantic:** `success #1E874B` (paid, resolved) · `warning #C77700` (due soon, partial) · `danger #C0392B` (overdue, destructive) · `info #2E75B6`

**Tenant portal:** primary `#14532D` · hover `#1F7A4C` · canvas `#FBF7EE` · accent `#C98A2B`

**Platform portal:** dark shell `#0F1E2B` · surface `#16293A` · primary `#0B2942` · accent `#E9A227` · ink `#E8EEF4`

### 2.4 Typography

| Role | Face | Weights | Used for |
|---|---|---|---|
| Display | **Sora** | 600, 700 | Page titles, KPI labels, marketing hero |
| Body / UI | **Inter** | 400, 500, 600 | Everything else |
| Ledger | **IBM Plex Mono** | 400, 500 | **All money, M-Pesa codes, invoice numbers, IDs, table dates** |

Scale (16px base):

| Name | Size | Weight | Leading | Use |
|---|---|---|---|---|
| `display-lg` | 2.25rem | 700 | 1.15 | Marketing hero only |
| `h1` | 1.75rem | 600 | 1.2 | Page title |
| `h2` | 1.375rem | 600 | 1.3 | Card heading |
| `h3` | 1.125rem | 600 | 1.4 | Sub-section |
| `body` | 0.9375rem | 400 | 1.55 | Default |
| `small` | 0.8125rem | 400 | 1.5 | Helper text |
| `label` | 0.75rem | 500 | 1.4 | Uppercase, 0.06em tracking |
| `metric` | 2rem | 500 | 1.1 | KPI numbers : IBM Plex Mono, tabular |

Always apply `font-variant-numeric: tabular-nums` to money and metrics. Without it a `1` is narrower than a `7` and your columns wobble.

**Spacing:** 4px base. Allowed steps 4, 8, 12, 16, 24, 32, 48, 64.
**Radius:** controls 8px · cards 12px · pills 999px · avatars 50%.
**Containers:** content 1440px · forms 640px · reading text 72ch.

### 2.5 Interface copy rules

- Buttons name the action: **"Record payment"**, not "Submit".
- The name persists: a button labelled *Publish* produces a toast that says *Published*.
- Errors say what happened and what to do: *"That phone number already belongs to another tenant. Use a different number, or open the existing tenant record."*
- Empty states invite: *"No properties yet. Add your first property to start tracking units and rent."* : with the action right there.
- Sentence case everywhere except the `label` style.
- Kenyan vocabulary: County, Estate, Caretaker, KES, M-Pesa code, `+254 7XX XXX XXX`.

### 2.6 Icons : Iconify with the Solar set

Install: `npm i @iconify/react`

Solar names follow `solar:<icon-name>-<style>` where style is one of `linear`, `line-duotone`, `bold`, `bold-duotone`, `broken`, `outline`.

**House rules**
- **Navigation and actions:** `linear` at 20px, stroke reads cleanly at small sizes.
- **Empty states and feature illustrations:** `bold-duotone` at 40–64px : the two tones pick up navy and gold automatically.
- **Status chips:** `bold` at 16px, filled shapes read faster at a glance.
- Never mix a second icon set. Visual consistency is an explicit UI/UX marking criterion.

#### The icon registry : build this in Phase 1

Never write `<Icon icon="solar:..." />` inside a page. Every icon is named semantically in one file, so a wrong or changed name is a one-line fix:

```ts
// src/lib/icons.ts
export const ICONS = {
  // Navigation
  dashboard:      "solar:widget-5-linear",
  properties:     "solar:buildings-3-linear",
  units:          "solar:home-angle-linear",
  myUnits:        "solar:home-angle-linear",
  tenants:        "solar:users-group-rounded-linear",
  leases:         "solar:document-text-linear",
  invoices:       "solar:bill-list-linear",
  payments:       "solar:wallet-money-linear",
  arrears:        "solar:danger-triangle-linear",
  maintenance:    "solar:wrench-linear",
  announcements:  "solar:bell-bing-linear",
  reports:        "solar:chart-2-linear",
  staff:          "solar:users-group-two-rounded-linear",
  subscription:   "solar:card-linear",
  settings:       "solar:settings-linear",
  auditLog:       "solar:clipboard-list-linear",

  // Platform portal
  organizations:  "solar:buildings-2-linear",
  jobs:           "solar:refresh-circle-linear",
  webhooks:       "solar:transfer-horizontal-linear",
  featureFlags:   "solar:flag-linear",
  systemHealth:   "solar:pulse-linear",

  // Actions
  add:            "solar:add-circle-linear",
  edit:           "solar:pen-new-square-linear",
  delete:         "solar:trash-bin-trash-linear",
  filter:         "solar:filter-linear",
  search:         "solar:magnifer-linear",
  export:         "solar:download-minimalistic-linear",
  send:           "solar:plain-linear",
  back:           "solar:alt-arrow-left-linear",
  menu:           "solar:hamburger-menu-linear",
  logout:         "solar:logout-2-linear",
  notifications:  "solar:bell-linear",

  // Status
  success:        "solar:check-circle-bold",
  warning:        "solar:danger-circle-bold",
  error:          "solar:close-circle-bold",
  pending:        "solar:clock-circle-bold",

  // Domain
  mpesa:          "solar:smartphone-linear",
  calendar:       "solar:calendar-linear",
  email:          "solar:letter-linear",
  phone:          "solar:phone-linear",
  document:       "solar:file-text-linear",
  occupancy:      "solar:pie-chart-2-linear",
  key:            "solar:key-linear",
  shield:         "solar:shield-check-linear",

  // Empty states : duotone, large
  emptyFolder:    "solar:folder-open-bold-duotone",
  emptyBuilding:  "solar:buildings-3-bold-duotone",
  emptyInbox:     "solar:inbox-bold-duotone",
  emptyMoney:     "solar:wallet-money-bold-duotone",
} as const;

export type IconName = keyof typeof ICONS;
```

Usage: `<Icon name="properties" size={20} />`

#### Verify the registry before you trust it

Solar has 7,400 icons and I have not hand-verified every name above. Rather than checking 50 pages by hand, use the Iconify API : it returns only the icons that exist, so anything missing from the response is a bad name. Run this once in Phase 1 and again whenever you add an icon:

```js
// scripts/verify-icons.mjs   →   node scripts/verify-icons.mjs
import { ICONS } from "../src/lib/icons.js";

const names = Object.values(ICONS).map(v => v.replace("solar:", ""));
const res = await fetch(`https://api.iconify.design/solar.json?icons=${names.join(",")}`);
const data = await res.json();
const found = new Set(Object.keys(data.icons ?? {}));

const missing = Object.entries(ICONS).filter(([, v]) => !found.has(v.replace("solar:", "")));
if (missing.length === 0) {
  console.log(`✅ all ${names.length} icons resolve`);
} else {
  console.log("❌ these names do not exist in Solar : fix them in src/lib/icons.ts:");
  missing.forEach(([k, v]) => console.log(`   ${k.padEnd(16)} ${v}`));
  process.exit(1);
}
```

Browse replacements at `https://icon-sets.iconify.design/solar/`. Wire this script into CI so a bad icon name fails the build rather than rendering a blank square in your demo.

> **Why this pattern matters beyond icons.** You have just turned "I am not sure these strings are right" into a machine-checked guarantee. That instinct : make uncertainty testable rather than arguing about it : is the difference between a junior and a senior engineer, and it is worth saying out loud in your viva.

---

## 3. THE THREE PORTALS

### 3.1 What each portal is

| # | Portal | Who | Route group | Production host | Local path | Theme |
|---|---|---|---|---|---|---|
| **1** | **Business Portal** | The landlord (Manager), his Employees, his Caretakers | `(business)` | `app.silqu.co.ke` | `/app/*` | Navy + gold, light |
| **2** | **Platform Portal** | You : SILQU platform admin and support/developer | `(platform)` | `platform.silqu.co.ke` | `/platform/*` | Deep navy dark shell + gold |
| **3** | **Tenant Portal** | Tenants | `(tenant)` | `my.silqu.co.ke` | `/my/*` | Forest green + warm cream, light |

Plus `(marketing)` on `silqu.co.ke` : landing page, pricing, sign-up.

### 3.2 Why three separate portals rather than one app with three menus

This is an architecture decision, and you should be able to give these four reasons without hesitating:

1. **Blast radius.** A rendering bug or a dependency vulnerability in the tenant portal cannot reach the platform portal, because they do not share a layout, a provider tree, or a set of client components.
2. **Session isolation.** Each portal issues its own cookie (`silqu.biz`, `silqu.platform`, `silqu.my`) with its own path scope and its own lifetime. A stolen tenant cookie is useless at the platform door. The platform cookie is short-lived and requires a second factor.
3. **Cognitive load.** A tenant should see five things, not fifty. A platform admin needs density and keyboard shortcuts. Those are opposite design goals; forcing them into one shell makes both worse.
4. **It matches how the business actually works.** The landlord's staff, the landlord's customers, and the software vendor are three different organisations with three different relationships to the data. The software should say so.

### 3.3 Three doors : the login routes

| Portal | Login route | Who may pass | Hardening |
|---|---|---|---|
| Business | `/login` | MANAGER, EMPLOYEE, CARETAKER | Rate limit 5 / 15 min per email+IP |
| Tenant | `/my/login` | TENANT only | Rate limit; friendly copy; big touch targets |
| Platform | `/platform/login` | PLATFORM_ADMIN, PLATFORM_SUPPORT | Email allowlist **+ TOTP second factor + 15-minute idle timeout + every action audited** |

Each door rejects the wrong role with a helpful redirect rather than a dead end: *"This account signs in through the tenant portal"* with a link.

> **Why the platform door is hardened differently:** it can see across every organization on the system. It is the highest-value target you have. Treating it identically to a tenant login would be the single biggest security hole in the design : and an examiner will look for exactly this.

### 3.4 Routing by host in production, by path in development

Subdomains do not exist on `localhost`, so `middleware.ts` resolves the portal from the hostname in production and from the path prefix in development:

```ts
// src/middleware.ts  (concept)
function resolvePortal(req: NextRequest): Portal {
  const host = req.headers.get("host") ?? "";
  if (process.env.NODE_ENV === "production") {
    if (host.startsWith("platform.")) return "platform";
    if (host.startsWith("my."))       return "tenant";
    if (host.startsWith("app."))      return "business";
    return "marketing";
  }
  const p = req.nextUrl.pathname;
  if (p.startsWith("/platform")) return "platform";
  if (p.startsWith("/my"))       return "tenant";
  if (p.startsWith("/app"))      return "business";
  return "marketing";
}
```

Middleware then does three things, in order:
1. Resolve the portal.
2. Read the session cookie **for that portal only**.
3. If the session's role is not in that portal's allowed set → redirect to that portal's login with a `?reason=` code.

`rewrite` maps the host to the internal route group so URLs stay clean: `app.silqu.co.ke/properties` internally serves `/(business)/properties`.

> **Beginner note : what middleware actually is.** It is a small function that runs *before* the page, on every request, at the edge. Think of a security guard in the lobby who checks your badge before you reach the lift. He is fast and he checks everyone : but he is a *signpost*, not the lock on the office door. The real lock is the server-side permission check inside each action (§6.4).

### 3.5 What lives in the Platform (developer) portal

This is the portal you have not designed yet, so here is the full specification. It has two jobs: **run the SaaS business** and **operate the software**.

**Business operations**
- Organizations: list, detail, suspend, reactivate, unit counts, storage used
- Subscriptions: plan, status, renewal date, MRR, expiring in 7 days, failed payments
- Users: platform-wide search, deactivate, force password reset, unlock after lockout
- Support access: view an organization's data **only** via an explicit, time-boxed, audited support session : never silently

**Developer operations** : this is what makes it a *developer* portal rather than a second admin page:
- **Jobs & Queues:** QStash schedules, recent runs, failures, dead-letter queue with a one-click replay
- **Webhooks:** every M-Pesa callback with its raw payload, result code, matched payment, and a replay button for sandbox testing
- **Feature flags:** Redis-backed booleans and percentage rollouts, toggled without a deploy
- **System health:** database latency, Redis latency, R2 reachability, last successful cron, 24-hour M-Pesa failure rate, error rate
- **Audit logs:** filter by org, actor, action, date; CSV export
- **Email log:** delivery status of every transactional email

> **Why a feature-flag page is worth building even for a student project.** It lets you demo a half-finished feature safely, turn it off if it misbehaves during the defence, and it demonstrates that you understand *release* is separate from *deploy*. That is a genuinely senior concept and it costs you about forty lines of code on top of Redis, which you already have.

---

## 4. FILE AND FOLDER STRUCTURE

### 4.1 Three rules explain the whole tree

1. **`app/` is routing only** : which URL shows what. Thin: fetch data, render components.
2. **`components/` is dumb and reusable** : receives props, renders. Knows nothing about your database.
3. **`server/` is where all thinking happens** : queries, permissions, business rules, external APIs. If it touches the database or a secret, it lives here and never ships to the browser.

Keep those straight and you will never have a "why is my DATABASE_URL in the browser bundle" incident.

```
silqu/
├── CLAUDE.md
├── README.md
├── .env.local                      # NEVER committed
├── .env.example                    # Committed : names only
├── next.config.mjs
├── postcss.config.mjs              # Tailwind v4 via @tailwindcss/postcss
├── vercel.json
├── package.json
│
├── prisma/
│   ├── schema.prisma               # THE data dictionary : paste into your SDS
│   ├── migrations/                 # COMMIT THESE
│   │   ├── 0001_init/migration.sql
│   │   └── 0002_partial_indexes/migration.sql   # hand-written
│   └── seed.ts
│
├── scripts/
│   ├── verify-icons.mjs
│   └── qstash-schedules.mjs        # Creates/updates QStash schedules
│
├── docs/
│   ├── SILQU_BUILD_PLAN_V2.md      # ← this file
│   ├── SRS.pdf  SDS.pdf  TEST_PLAN.pdf
│   └── decisions/                  # ADRs, one .md per decision
│       ├── 0001-neon-and-prisma.md
│       ├── 0002-money-as-integer-cents.md
│       ├── 0003-three-portals.md
│       ├── 0004-temp-password-over-magic-link.md
│       └── 0005-qstash-over-cron.md
│
├── public/
│   ├── logo/                       # silqu-mark.svg, silqu-wordmark.svg
│   └── kcau-logo.png
│
├── src/
│   ├── middleware.ts               # Portal resolution + session + role gate
│   │
│   ├── app/
│   │   ├── layout.tsx              # Root: fonts, PrelineClient, providers
│   │   ├── globals.css             # Tailwind v4 @theme + Preline imports
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── (marketing)/            # silqu.co.ke
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   └── signup/page.tsx     # Manager sign-up + subscription
│   │   │
│   │   ├── (business)/             # app.silqu.co.ke  →  /app/*
│   │   │   ├── layout.tsx          # data-portal="business"
│   │   │   ├── login/page.tsx
│   │   │   ├── set-password/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── app/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── properties/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [propertyId]/{page,edit,units}/…
│   │   │       ├── units/{page.tsx,[unitId]/page.tsx}
│   │   │       ├── tenants/{page,new,[tenantId]}/…
│   │   │       ├── leases/{page,new,[leaseId]}/…
│   │   │       ├── invoices/{page.tsx,[invoiceId]/page.tsx}
│   │   │       ├── payments/{page.tsx,record/page.tsx}
│   │   │       ├── arrears/page.tsx
│   │   │       ├── maintenance/{page.tsx,[requestId]/page.tsx}
│   │   │       ├── announcements/{page.tsx,new/page.tsx}
│   │   │       ├── reports/{page,collections,arrears,occupancy}/…
│   │   │       ├── staff/{page.tsx,invite/page.tsx}
│   │   │       └── settings/{page,organization,subscription,profile}/…
│   │   │
│   │   ├── (tenant)/               # my.silqu.co.ke  →  /my/*
│   │   │   ├── layout.tsx          # data-portal="tenant"
│   │   │   ├── my/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── accept-invite/page.tsx
│   │   │   │   ├── page.tsx            # Home: balance hero
│   │   │   │   ├── invoices/page.tsx
│   │   │   │   ├── payments/page.tsx
│   │   │   │   ├── pay/page.tsx        # M-Pesa STK
│   │   │   │   ├── maintenance/{page.tsx,new/page.tsx}
│   │   │   │   ├── announcements/page.tsx
│   │   │   │   ├── lease/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │
│   │   ├── (platform)/             # platform.silqu.co.ke  →  /platform/*
│   │   │   ├── layout.tsx          # data-portal="platform"
│   │   │   └── platform/
│   │   │       ├── login/page.tsx      # + TOTP step
│   │   │       ├── page.tsx            # Ops overview
│   │   │       ├── organizations/{page.tsx,[orgId]/page.tsx}
│   │   │       ├── subscriptions/page.tsx
│   │   │       ├── users/page.tsx
│   │   │       ├── jobs/page.tsx       # QStash schedules + DLQ
│   │   │       ├── webhooks/page.tsx   # Raw M-Pesa callbacks + replay
│   │   │       ├── flags/page.tsx      # Redis feature flags
│   │   │       ├── audit-logs/page.tsx
│   │   │       ├── email-log/page.tsx
│   │   │       └── health/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── mpesa/{stk-push,callback,timeout}/route.ts
│   │       ├── jobs/                   # ← QStash targets, signature-verified
│   │       │   ├── generate-invoices/route.ts
│   │       │   ├── generate-invoices-for-org/route.ts
│   │       │   ├── arrears-reminders/route.ts
│   │       │   ├── expire-leases/route.ts
│   │       │   ├── send-email/route.ts
│   │       │   └── build-receipt/route.ts
│   │       ├── uploads/sign/route.ts
│   │       ├── stk-status/[checkoutId]/route.ts
│   │       └── health/route.ts
│   │
│   ├── components/
│   │   ├── ui/                     # Preline markup wrapped as React
│   │   │   ├── preline-client.tsx  # ← the Preline initialiser
│   │   │   ├── button.tsx  input.tsx  select.tsx  textarea.tsx
│   │   │   ├── checkbox.tsx  switch.tsx  badge.tsx  card.tsx
│   │   │   ├── modal.tsx  offcanvas.tsx  dropdown.tsx  tooltip.tsx
│   │   │   ├── tabs.tsx  accordion.tsx  stepper.tsx  timeline.tsx
│   │   │   ├── toast.tsx  skeleton.tsx  spinner.tsx  pagination.tsx
│   │   │   ├── breadcrumb.tsx  progress.tsx  avatar.tsx
│   │   │   ├── combobox.tsx  datepicker.tsx  file-upload.tsx
│   │   │   ├── pin-input.tsx  strong-password.tsx
│   │   │   ├── icon.tsx            # Iconify + ICONS registry
│   │   │   ├── money.tsx           # ← the ledger signature component
│   │   │   ├── empty-state.tsx
│   │   │   └── data-table.tsx      # TanStack logic + Preline markup
│   │   ├── layout/
│   │   │   ├── business-shell.tsx  tenant-shell.tsx  platform-shell.tsx
│   │   │   ├── sidebar.tsx  topbar.tsx  mobile-nav.tsx
│   │   │   ├── page-header.tsx  nav-item.tsx
│   │   │   └── notification-bell.tsx
│   │   ├── dashboard/  properties/  tenants/  leases/
│   │   ├── billing/    maintenance/ announcements/
│   │   ├── platform/   # org-table, dlq-table, webhook-viewer, flag-toggle
│   │   └── charts/     # ApexCharts wrappers, dynamic ssr:false
│   │
│   ├── server/
│   │   ├── db/
│   │   │   ├── client.ts           # Prisma singleton + Neon adapter
│   │   │   └── queries/            # READ. Always org-scoped.
│   │   │       ├── properties.ts  tenants.ts  leases.ts
│   │   │       ├── invoices.ts    payments.ts  reports.ts
│   │   │       └── platform.ts
│   │   ├── actions/                # WRITE. Server Actions.
│   │   │   ├── property.actions.ts   tenant.actions.ts
│   │   │   ├── lease.actions.ts      invoice.actions.ts
│   │   │   ├── payment.actions.ts    maintenance.actions.ts
│   │   │   ├── announcement.actions.ts  staff.actions.ts
│   │   │   ├── subscription.actions.ts  platform.actions.ts
│   │   ├── auth/
│   │   │   ├── config.ts           # Auth.js, three cookie configs
│   │   │   ├── session.ts          # requireUser / requireRole / requirePortal
│   │   │   ├── permissions.ts      # can(user, action, resource)
│   │   │   ├── password.ts         # bcrypt, temp-password generator
│   │   │   ├── totp.ts             # Platform portal second factor
│   │   │   └── invitations.ts
│   │   ├── services/
│   │   │   ├── redis/
│   │   │   │   ├── client.ts  ratelimit.ts  cache.ts
│   │   │   │   ├── idempotency.ts  lock.ts  flags.ts
│   │   │   ├── queue/
│   │   │   │   ├── client.ts       # QStash publish helpers
│   │   │   │   ├── verify.ts       # Signature verification
│   │   │   │   └── schedules.ts
│   │   │   ├── mpesa/{client,reconcile,types}.ts
│   │   │   ├── storage/r2.ts
│   │   │   ├── email/{send.ts,templates/}
│   │   │   ├── billing/
│   │   │   │   ├── generate-invoices.ts
│   │   │   │   ├── allocate-payment.ts
│   │   │   │   └── compute-arrears.ts
│   │   │   ├── pdf/receipt.tsx
│   │   │   └── audit.ts
│   │   └── validators/             # Zod schemas : shared client + server
│   │
│   ├── lib/
│   │   ├── money.ts      # toCents, fromCents, formatKES
│   │   ├── dates.ts      # Africa/Nairobi
│   │   ├── phone.ts      # normalise to 254XXXXXXXXX
│   │   ├── icons.ts      # ← the icon registry
│   │   ├── nav.ts        # Portal nav config
│   │   ├── constants.ts  errors.ts  utils.ts
│   │
│   ├── hooks/            # use-toast, use-debounce, use-media-query
│   └── types/index.ts
│
├── services/reports-go/  # Go microservice
│   ├── main.go  handlers/  internal/  go.mod  Dockerfile
│
└── tests/
    ├── unit/     money · allocate-payment · permissions · idempotency
    └── e2e/      auth · property-crud · tenant-onboarding
                  invoice-payment · caretaker-scope · portal-isolation
```

> **Do not create all of these folders on day one.** Empty folders are noise. Create each in the phase that needs it. This tree is the destination, not the starting point.

---

## 5. DATA MODEL (PRISMA)

### 5.1 The entities in plain English

- An **Organization** is one property management business : the thing that pays the SILQU subscription.
- A **User** is anyone who logs in. Their `role` decides which portal accepts them.
- A **Property** is a building or estate. It has many **Units**.
- A **Unit** is one rentable door ("B12").
- A **Tenant** is a person renting. A **Lease** joins one Tenant to one Unit, for a period, at a rent.
- An **Invoice** is a monthly bill generated from a Lease, made of **InvoiceLines** (rent, water, garbage, penalty).
- A **Payment** is money received. **PaymentAllocations** decide which invoices that money settles : this is what lets a tenant pay KES 20,000 that clears last month's arrears *and* part of this month.
- **MpesaTransaction** is the raw, append-only log of every STK Push and every callback. Never delete a row from it.
- **AuditLog** records who did what, when. Your Data Protection Act compliance story lives here.

### 5.2 Entity relationships

```
Organization 1──n User
Organization 1──1 Subscription
Organization 1──n Property 1──n Unit
Unit 1──n Lease n──1 Tenant
Lease 1──n Invoice 1──n InvoiceLine
Tenant 1──n Payment 1──n PaymentAllocation n──1 Invoice
Unit 1──n MaintenanceRequest n──1 Tenant
User n──n Property   (via CaretakerAssignment)
```

### 5.3 The money type decision : read this before writing the schema

Money is integer cents. In Prisma that leaves a real choice, and it has a sharp edge:

| Prisma type | Postgres | Max value | Problem |
|---|---|---|---|
| `Int` | `integer` | 2,147,483,647 cents = **KES 21,474,836** | Caps a single row |
| `BigInt` | `bigint` | effectively unlimited | **Does not serialise to JSON, and cannot cross the Server→Client boundary in React** |
| `Decimal` | `numeric` | exact, unlimited | Returns a Decimal.js object : same serialisation problem, plus you lose the "integers only" discipline |

**Decision: use `Int` for every per-row money column, and compute aggregates as `BigInt` in SQL, converting to string at the query boundary.**

KES 21.4 million is far above any single Kenyan rent, invoice or payment, so `Int` is safe per row. Totals across an entire portfolio *can* exceed it, so aggregate queries cast to `bigint` and the query layer returns a plain `number` or a formatted string, never a raw `BigInt`, to the UI.

Add a database `CHECK` so the cap is enforced rather than assumed, and write a comment in the schema recording the limit. If SILQU ever needs a single row above KES 21M, that is a deliberate migration, not a silent overflow.

> **Why this matters more than it looks.** The `BigInt` boundary error is one of the most common and most confusing bugs in Prisma + Next.js App Router projects. It appears as *"Do not know how to serialize a BigInt"* at runtime, usually the first time you pass data from a Server Component into a chart. Choosing `Int` now means you never meet it.

### 5.4 Model list

| Model | Key fields | Notes |
|---|---|---|
| `Organization` | id, name, county, phone, email, logoUrl, status | The SaaS customer |
| `Subscription` | id, orgId, plan, status, unitLimit, currentPeriodEnd | Gates access |
| `User` | id, orgId?, email @unique, phone, passwordHash, role, status, mustChangePassword, totpSecret?, lastLoginAt | `orgId` null for platform roles |
| `EmployeeProfile` | userId, subRole | FINANCE · CUSTOMER_CARE · OWNER_MANAGER |
| `CaretakerAssignment` | id, userId, propertyId, unitId? | Defines caretaker data scope |
| `Property` | id, orgId, name, county, town, address, type, photoUrl, status | |
| `Unit` | id, orgId, propertyId, label, unitType, bedrooms, rentCents, depositCents, status | `@@unique([propertyId, label])` |
| `Tenant` | id, orgId, userId?, fullName, nationalId, phone, email, nextOfKin*, status | `userId` set on invite acceptance |
| `Lease` | id, orgId, unitId, tenantId, startDate, endDate, rentCents, depositCents, billingDay, status | One ACTIVE per unit : partial index |
| `Invoice` | id, orgId, leaseId, invoiceNo, periodYear, periodMonth, issueDate, dueDate, totalCents, paidCents, balanceCents, status | `@@unique([leaseId, periodYear, periodMonth])` |
| `InvoiceLine` | id, invoiceId, category, description, amountCents | RENT · WATER · GARBAGE · PENALTY · OTHER |
| `Payment` | id, orgId, tenantId, leaseId, amountCents, method, mpesaReceipt?, reference?, paidAt, recordedById, status | MPESA · BANK · CASH |
| `PaymentAllocation` | id, paymentId, invoiceId, amountCents | The money split |
| `MpesaTransaction` | id, orgId?, purpose, checkoutRequestId @unique, merchantRequestId, phone, amountCents, accountRef, resultCode?, resultDesc?, mpesaReceipt?, rawCallback Json?, status | Append-only |
| `MaintenanceRequest` | id, orgId, unitId, tenantId?, category, description, priority, status, assignedToId?, resolvedAt? | |
| `MaintenanceComment` | id, requestId, userId, body | |
| `Announcement` | id, orgId, title, body, audience, propertyId?, unitId?, createdById, publishedAt? | |
| `Invitation` | id, orgId, email, role, tokenHash, expiresAt, acceptedAt?, createdById | Token hashed, never raw |
| `Notification` | id, userId, type, title, body, link?, readAt? | |
| `Document` | id, orgId, entityType, entityId, kind, fileKey, isPrivate, uploadedById | `fileKey` not URL : see §8.3 |
| `AuditLog` | id, orgId?, actorUserId?, action, entityType, entityId?, before Json?, after Json?, ipAddress?, createdAt | |
| `EmailLog` | id, orgId?, to, template, providerId?, status, error?, sentAt | Platform portal email log |

### 5.5 Constraints that do real work

Each of these prevents one specific bug. Prisma expresses some; the rest need hand-written migration SQL.

**Prisma can express these:**
```prisma
@@unique([leaseId, periodYear, periodMonth])   // Invoice : idempotency
@@unique([propertyId, label])                  // Unit : no duplicate door numbers
@@unique([checkoutRequestId])                  // MpesaTransaction : duplicate callbacks
```

**Prisma cannot : write these by hand.** Create an empty migration with `npx prisma migrate dev --create-only --name partial_indexes`, then paste:

```sql
-- One ACTIVE lease per unit. Prevents double-letting a door.
CREATE UNIQUE INDEX one_active_lease_per_unit
  ON "Lease" ("unitId") WHERE status = 'ACTIVE';

-- Money sanity. Also documents the Int cap (KES 21,474,836).
ALTER TABLE "Payment"     ADD CONSTRAINT payment_amount_positive
  CHECK ("amountCents" > 0 AND "amountCents" <= 2147483647);
ALTER TABLE "InvoiceLine" ADD CONSTRAINT line_amount_positive
  CHECK ("amountCents" > 0);
ALTER TABLE "Unit"        ADD CONSTRAINT rent_non_negative
  CHECK ("rentCents" >= 0);

-- A payment can never be allocated to more than it is worth.
-- (Enforced in the transaction too; this is the backstop.)
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT allocation_positive
  CHECK ("amountCents" > 0);

-- Financial records are never orphaned.
-- Set these relations to Restrict in schema.prisma, not Cascade.
```

**Referential rules:** every financial relation uses `onDelete: Restrict`. You must never be able to delete a tenant who has payment history. Archive with `status`, never delete.

**Indexes:** every foreign key, plus `Invoice.status`, `Lease.status`, `Unit.status`, `Payment.paidAt`, `AuditLog.createdAt`, and `(orgId, createdAt)` composites on anything you list chronologically.

### 5.6 Prisma client singleton : get this right in Phase 2

```ts
// src/server/db/client.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter: new PrismaNeon(pool),
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

> **Why the global.** In development, Next.js hot-reloads modules on every save. Without the singleton you create a new PrismaClient : and a new connection pool : every time you edit a file, and within twenty minutes Neon refuses new connections. This four-line pattern is the fix, and almost every Prisma + Next.js project has it.

---

## 6. ROLES AND PERMISSIONS ACROSS THREE PORTALS

### 6.1 Six roles, three portals

| Role | Portal | Who they are | Data scope |
|---|---|---|---|
| `PLATFORM_ADMIN` | Platform | You | Everything, across all organizations |
| `PLATFORM_SUPPORT` | Platform | Support / developer teammate | Read-only platform data; org data only inside a time-boxed, audited support session |
| `MANAGER` | Business | The landlord / business owner | Everything inside their own organization |
| `EMPLOYEE` | Business | Staff hired by the manager | Org-wide, narrowed by sub-role |
| `CARETAKER` | Business | On-site staff | **Only assigned properties and units** |
| `TENANT` | Tenant | The renter | **Only their own lease, invoices, payments, requests** |

Employee sub-roles: **FINANCE** (invoices, payments, arrears, reports) · **CUSTOMER_CARE** (tenants, maintenance, announcements) · **OWNER_MANAGER** (everything except subscription and staff management).

### 6.2 Permission matrix

`✓` full · `R` read-only · `S` scoped to assignment or self · `:` none

| Capability | PLAT_ADMIN | PLAT_SUPPORT | MANAGER | EMP: Finance | EMP: Care | EMP: Owner | CARETAKER | TENANT |
|---|---|---|---|---|---|---|---|---|
| View own dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | S | S |
| Create / edit property | : | : | ✓ | : | : | ✓ | : | : |
| View properties | R | S | ✓ | R | R | ✓ | S | : |
| Create / edit unit | : | : | ✓ | : | : | ✓ | : | : |
| Update unit status | : | : | ✓ | : | : | ✓ | S | : |
| Onboard tenant / send invite | : | : | ✓ | : | ✓ | ✓ | : | : |
| View tenant records | R | S | ✓ | R | ✓ | ✓ | S | : |
| Create / end lease | : | : | ✓ | : | : | ✓ | : | : |
| Generate invoices | : | : | ✓ | ✓ | : | ✓ | : | : |
| Record payment | : | : | ✓ | ✓ | : | ✓ | : | : |
| View own invoices / payments | : | : | : | : | : | : | : | S |
| Pay rent via M-Pesa | : | : | : | : | : | : | : | S |
| View arrears report | R | R | ✓ | ✓ | R | ✓ | : | : |
| Raise maintenance request | : | : | ✓ | : | ✓ | ✓ | S | S |
| Resolve maintenance request | : | : | ✓ | : | ✓ | ✓ | S | : |
| Close maintenance request | : | : | ✓ | : | : | ✓ | : | S |
| Publish announcement | : | : | ✓ | : | ✓ | ✓ | : | : |
| Invite / manage staff | : | : | ✓ | : | : | : | : | : |
| Manage own subscription | : | : | ✓ | : | : | : | : | : |
| View own org audit log | : | : | ✓ | : | : | R | : | : |
| Suspend an organization | ✓ | : | : | : | : | : | : | : |
| View platform audit log | ✓ | R | : | : | : | : | : | : |
| Replay a queue job / webhook | ✓ | : | : | : | : | : | : | : |
| Toggle a feature flag | ✓ | : | : | : | : | : | : | : |
| Start a support session | ✓ | ✓ | : | : | : | : | : | : |

### 6.3 Portal isolation rules : the hard boundary

These are absolute and must be covered by an automated test (`tests/e2e/portal-isolation.spec.ts`):

1. A `TENANT` session presented at `app.silqu.co.ke` is rejected. Not "sees an empty page" : **rejected**.
2. A `MANAGER` session presented at `platform.silqu.co.ke` is rejected.
3. A `PLATFORM_SUPPORT` session cannot read any organization's tenant personal data without an open, time-boxed support session, and opening one writes an `AuditLog` row naming the org, the reason, and the expiry.
4. Cookie names differ per portal, so a cookie copied from one portal is not even parsed by another.
5. The platform portal session expires after 15 minutes of inactivity. The others use 8 hours (business) and 30 days (tenant, because tenants log in rarely and abandonment is a real product risk).

### 6.4 Three layers of enforcement : all required

1. **Middleware** : is there a valid session for *this portal*, and is the role allowed here? Wrong portal → redirect. *This is a signpost, not a lock.*
2. **Server guard** : every Server Action and every query begins with `const user = await requireRole(["MANAGER", "EMPLOYEE"])`. **This is the actual lock.**
3. **UI** : hide what the user cannot do, so the interface is honest. *This is courtesy, and provides zero security.*

> **The mistake nearly every student makes** is implementing only layer 3, then discovering during the viva that typing the URL directly gives full access. Build layer 2 first, every time.

---

## 7. UI COMPONENTS : PRELINE UI v4.2

### 7.1 Installing Preline with Next.js : the part that trips people up

Preline is a **DOM-driven** library. Its JavaScript scans the page after render and attaches behaviour to matching markup. Next.js App Router replaces route markup on client navigation *without* a page reload : so Preline must be told to re-scan after every navigation, or your dropdowns and modals silently stop working on the second page you visit.

```bash
npm i preline @tailwindcss/forms
```

```tsx
// src/components/ui/preline-client.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PrelineClient() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    import("preline/non-auto").then(({ HSStaticMethods }) => {
      if (!cancelled) HSStaticMethods.autoInit();
    });
    return () => { cancelled = true; };
  }, [pathname]);

  return null;
}
```

```tsx
// src/app/layout.tsx
import PrelineClient from "@/components/ui/preline-client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PrelineClient />   {/* near the end of body, after content */}
      </body>
    </html>
  );
}
```

**Why `preline/non-auto` and not plain `preline`:** the default entry auto-initialises on page load, which fights Next.js hydration timing. `non-auto` gives you `HSStaticMethods` and named plugin classes and lets *you* decide when to scan. `usePathname()` as the effect dependency is what makes route-aware re-scanning work.

`autoInit` is collection-aware : it skips elements that already have an instance and filters nodes that have left the document, so repeated scans are safe and expected.

**For a component that owns exactly one plugin root**, prefer a manual instance with cleanup:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { HSDropdown, type IHTMLElementFloatingUI } from "preline/non-auto";

export function Dropdown({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const instance = new HSDropdown(ref.current as unknown as IHTMLElementFloatingUI);
    return () => instance.destroy();
  }, []);
  return <div ref={ref} className="hs-dropdown relative inline-flex">{children}</div>;
}
```

Preline keeps instances in global registries (`window.$hsDropdownCollection`). For manual instances call `destroy()`; for route-level scans `autoInit` cleans up for you. You can also call `HSStaticMethods.cleanCollection(["dropdown", "overlay"])`.

**Optional dependencies:** most core plugins are plain JavaScript. Positioning uses `@floating-ui/dom`. jQuery is needed **only** for Preline's Datatables (because `datatables.net` requires it) : which is one reason we are not using it (§7.4). Range Slider needs `noUiSlider`.

### 7.2 The token swap : do not paste Preline markup unchanged

Preline's examples use stock Tailwind palette classes (`bg-blue-600`, `text-gray-800`, `border-gray-200`). If you paste them as-is, your carefully designed navy-and-gold system dies within a week and every screen drifts.

**Rule:** every Preline snippet goes through this substitution before it enters the codebase.

| Preline example class | SILQU replacement |
|---|---|
| `bg-blue-600` / `hover:bg-blue-700` | `bg-primary` / `hover:bg-primary-hover` |
| `text-blue-600` | `text-primary` |
| `bg-gray-50` | `bg-canvas` |
| `bg-white` | `bg-surface` |
| `text-gray-800` | `text-ink` |
| `text-gray-500` / `text-gray-400` | `text-ink-muted` |
| `border-gray-200` | `border-line` |
| `text-red-600` / `bg-red-*` | `text-danger` / `bg-danger/10` |
| `text-green-600` | `text-success` |
| `text-yellow-600` / `text-amber-*` | `text-warning` |
| `focus:ring-blue-500` | *(remove : global `:focus-visible` handles it)* |
| `rounded-lg` | `rounded-[--radius-control]` |
| `rounded-xl` | `rounded-[--radius-card]` |
| `shadow-sm` | `shadow-[--shadow-card]` |

Add an ESLint rule or a simple grep check in CI that fails on raw Tailwind palette colours (`blue-`, `gray-`, `red-`, `green-`) inside `src/components/**`. Machine-enforced consistency beats remembering.

### 7.3 Preline component → SILQU usage map

Every one of these is in the Preline docs at `https://preline.co/docs/components/<name>.html`.

| SILQU need | Preline component | Where it is used |
|---|---|---|
| App shell navigation | **Sidebar** | Business + Platform shells |
| Top navigation | **Navbar** | Tenant portal, marketing |
| Page trail | **Breadcrumb** | Every business detail page |
| Section switching | **Tabs** | Tenant detail (Ledger / Lease / Requests / Documents) |
| Multi-step flows | **Stepper** | Lease wizard, manager sign-up, bulk unit creation |
| Row actions | **Dropdown**, **Context Menu** | Every table row |
| Confirmations & quick forms | **Modal** | End lease, archive unit, confirm invoice run |
| Mobile filters & detail peek | **Offcanvas (Drawer)** | All list pages on mobile |
| Explanations | **Tooltip**, **Popover** | Icon-only buttons, ageing-bucket definitions |
| Status pills | **Badge** | Invoice / lease / unit / request status |
| Inline messages | **Alerts** | Subscription expiring, arrears warning |
| Feedback after an action | **Toasts** | Every mutation |
| Surfaces | **Card** | Dashboards, detail panels |
| Loading | **Skeleton**, **Spinners** | Every data route |
| List paging | **Pagination** | Every table |
| Occupancy bars | **Progress** | Property occupancy |
| Chart legends | **Legend Indicator** | Collections and occupancy charts |
| People | **Avatar**, **Avatar Group** | Staff lists, assigned caretakers |
| **Maintenance conversation** | **Chat Bubbles** | Tenant ↔ caretaker ↔ manager thread |
| **Request history** | **Timeline** | Maintenance status history, tenant ledger |
| **Property → Unit hierarchy** | **Tree View** | Property explorer sidebar |
| Collapsible detail | **Accordion**, **Collapse** | Invoice lines, FAQ, report filters |
| Text entry | **Input**, **Input Group**, **Textarea** | Everywhere; Input Group gives the `KES` prefix |
| Choices | **Select**, **Checkbox**, **Radio**, **Switch** | Forms and status toggles |
| **Searchable pickers** | **Advanced Select**, **ComboBox** | Choose tenant, choose vacant unit |
| Global search | **SearchBox** | Topbar |
| Quantities | **Input Number** | Bulk unit count, bedrooms |
| Dates | **Datepicker**, **Advanced Datepicker** | Lease dates, report ranges, due dates |
| **Password strength** | **Strong Password** | `/set-password`, `/accept-invite` |
| **Show / hide password** | **Toggle Password** | All three login pages |
| **Two-factor code entry** | **PIN Input** | Platform portal TOTP step |
| File selection | **File Input**, **File Upload**, **File Uploading Progress** | Property photos, ID scans, lease PDFs |
| Copy a reference | **Clipboard** | M-Pesa codes, invoice numbers, API keys |
| Charts | **Charts** (ApexCharts) | Collections, occupancy, arrears ageing |
| Tables | **Tables** (markup only) | All lists : logic from TanStack, see §7.4 |
| Layout | **Container**, **Grid**, **Columns**, **Dividers** | Everywhere |
| Long lists | **Custom Scrollbar** | Sidebar, notification panel |
| Keyboard shortcuts | **KBD** | Platform portal |
| Marketing polish | **Carousel**, **Marquee**, **Devices** | Landing page only |

### 7.4 What is **not** in Preline : sourced outside, with reasons

| Need | Source | Why not Preline |
|---|---|---|
| **Table logic** (sorting, pagination, column visibility, row selection) | **TanStack Table** (headless) + Preline table markup | Preline's Datatables plugin wraps `datatables.net`, which **requires jQuery**. Pulling jQuery into a Next.js app for one feature is a real cost, and Preline's version is client-side : it cannot paginate 5,000 invoices on the server. TanStack gives you headless logic, and you keep Preline's markup. **Say this out loud in your viva; it is a genuine, defensible engineering judgement.** |
| **Form state & validation** | react-hook-form + Zod + `@hookform/resolvers` | Preline provides markup, not state. Zod also runs server-side, which is the part that actually matters. |
| **Icons** | Iconify + Solar | Preline's "Styled Icons" are decorative containers, not an icon set. |
| **Programmatic toasts from Server Actions** | Small custom store over Preline Toast markup (or `sonner`) | Preline Toasts are static markup; you need to fire one from an action result. ~40 lines. |
| **PDF generation** (receipts, statements) | `@react-pdf/renderer` | Out of scope for a CSS component library. |
| **CSV export** | `papaparse` | Same. |
| **Date maths & timezones** | `date-fns` + `date-fns-tz` | Preline's Datepicker is UI; `Africa/Nairobi` correctness is logic. |
| **Charts wrapper for React/SSR** | `react-apexcharts` with `dynamic(..., { ssr: false })` | Preline documents ApexCharts, but the React + SSR wiring is yours. |
| **Auth UI logic** | Auth.js v5 | Preline gives login *markup* only. |
| **Toast/notification persistence** | Your `Notification` model | Product logic. |
| **Rich text** (if announcements ever need it) | Preline **WYSIWYG Editor** (Quill) *or* plain textarea | Start with a textarea. Rich text on tenant-facing announcements is a sanitisation liability you do not need. |

> **Design note.** Preline covers roughly 85% of SILQU's UI surface. The 15% you source outside is almost entirely *logic*, not *looks* : which is exactly the right split. A component library should give you appearance and interaction; your application should own behaviour and rules.

---

## 8. INFRASTRUCTURE : REDIS, QSTASH, R2

### 8.1 Upstash Redis : the counter's notebook

Redis is an in-memory key–value store: extremely fast, and everything in it can expire. Think of it as the notebook the shopkeeper keeps on the counter for things he needs to remember for a few minutes : not the stockroom ledger.

```bash
npm i @upstash/redis @upstash/ratelimit
```

**Five jobs Redis does in SILQU**

| Job | Key pattern | TTL | Why |
|---|---|---|---|
| **Rate limiting** | `rl:login:{email}:{ip}` | 15 min | Stops password guessing. Sliding window, 5 attempts. Also on invite send, password reset, and STK Push (3 / 5 min per phone : a real cost control, since each push costs money and annoys the tenant). |
| **KPI cache** | `kpi:{orgId}:dashboard` | 60 s | The manager dashboard runs six aggregate queries. Caching for 60 seconds turns a 900ms page into a 40ms page with no meaningful staleness. Bust it on any payment or invoice write. |
| **Idempotency keys** | `idem:{operation}:{key}` | 24 h | Second layer of defence for M-Pesa callbacks and invoice runs. The database unique constraint is the real guarantee; Redis stops the work from even starting. |
| **Distributed lock** | `lock:invoices:{orgId}:{yyyy-mm}` | 5 min | Two managers clicking *Generate invoices* at the same second. `SET key value NX EX 300` : only one wins, the other sees "This run is already in progress." |
| **Feature flags** | `flag:{name}` | none | Toggle from the platform portal without a deploy. |

```ts
// src/server/services/redis/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";

export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:login",
  analytics: true,
});
```

**Rules**
- Redis is a **cache and a counter**, never a source of truth. If Redis is wiped, SILQU must still be completely correct : just slower.
- **Never store personal data in Redis** beyond a hashed identifier. It is easier to leak and harder to audit than Postgres. This is a Data Protection Act point worth one sentence in your documentation.
- Every key gets a TTL unless it is a feature flag.
- Namespace every key by purpose (`rl:`, `kpi:`, `idem:`, `lock:`, `flag:`) so the platform portal can list them by category.

### 8.2 Upstash QStash : the to-do list that will not forget

QStash is an HTTP message queue and scheduler. You publish a message; QStash calls one of your API routes; if that call fails, QStash retries with exponential backoff; if it keeps failing, the message lands in a **dead-letter queue** you can inspect and replay.

```bash
npm i @upstash/qstash
```

**Why not Vercel Cron.** Cron fires an HTTP request on a schedule and then forgets. If your invoice run throws on tenant 147 of 200, cron does not know, does not retry, and nobody is told. QStash retries the message, and if it still fails, it is sitting in the DLQ with its payload when you look at the platform portal on Monday. For a system that bills people money, that difference is the whole ballgame.

**The fan-out pattern : the most important idea in this section**

Generating invoices for every organization inside one HTTP request will time out on Vercel. So split the work:

```
QStash schedule (1st, 06:00 EAT)
        │
        ▼
POST /api/jobs/generate-invoices          ← finds active orgs, publishes N messages
        │
        ├──▶ POST /api/jobs/generate-invoices-for-org  { orgId, year, month }
        ├──▶ POST /api/jobs/generate-invoices-for-org  { orgId, year, month }
        └──▶ …                                          each small, each retryable
                    │
                    └──▶ POST /api/jobs/send-email  { invoiceId }  (one per invoice)
```

Each message is small, fast, and independently retryable. One organization failing does not stop the other forty-nine. **This is how real billing systems work**, and being able to draw this diagram will impress an examiner far more than the feature itself.

**Scheduled jobs**

| Job | Schedule (EAT) | Does |
|---|---|---|
| `generate-invoices` | 1st, 06:00 | Fan out invoice generation per organization |
| `arrears-reminders` | 5th, 08:00 | Notify tenants with a balance |
| `expire-leases` | Daily, 00:30 | Move past-end-date leases to ENDED, free the units |
| `subscription-renewals` | Daily, 07:00 | Flag subscriptions expiring in 7 days; mark expired ones PAST_DUE |
| `mpesa-reconcile` | Every 30 min | Sweep for STK transactions stuck INITIATED > 10 min and query their status |

**Every job route must verify the QStash signature.** An unsigned `/api/jobs/*` route is an open button on the internet that anyone can press to bill your users.

```ts
// src/app/api/jobs/generate-invoices/route.ts
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

async function handler(req: Request) {
  // … fan out per org
  return Response.json({ ok: true });
}

export const POST = verifySignatureAppRouter(handler);
```

**Rules**
- Every job handler is **idempotent**. QStash retries; assume every job runs more than once.
- Handlers return 2xx on success. Return a 5xx to *request* a retry; return 2xx with a logged error for a permanent failure that retrying will not fix (e.g. a malformed email address).
- Keep each handler under ~10 seconds. If it is longer, it should have been fanned out.
- Job payloads carry IDs, never whole objects. Re-read from the database inside the handler so you act on current state.

### 8.3 Cloudflare R2 : object storage

Neon stores rows. Files go to R2, which is S3-compatible with no egress fees.

**Two buckets, and the distinction matters legally**

| Bucket | Access | Contents |
|---|---|---|
| `silqu-public` | Public read | Property photos, organization logos |
| `silqu-private` | **No public access** : signed URLs only, 5-minute expiry | Tenant national ID scans, signed lease PDFs, receipts, maintenance photos |

A tenant's national ID sitting on a guessable public URL is a Data Protection Act, 2019 breach. Private bucket, short-lived signed reads, and an `AuditLog` row every time a private document is fetched.

**Key structure** : orderly keys make lifecycle rules and debugging possible:

```
{orgId}/properties/{propertyId}/photo/{uuid}.webp
{orgId}/tenants/{tenantId}/id/{uuid}.pdf          ← private
{orgId}/leases/{leaseId}/signed/{uuid}.pdf        ← private
{orgId}/maintenance/{requestId}/{uuid}.webp
{orgId}/receipts/{paymentId}.pdf                  ← private
```

Store the **key**, not the URL, in the `Document.fileKey` column. URLs change when you move buckets or add a CDN; keys do not.

**Upload flow : the file never touches your server**

1. Browser asks `POST /api/uploads/sign` with filename, MIME type and size.
2. Server checks permission, validates type and size, generates a key, returns a **presigned PUT URL** valid for 5 minutes.
3. Browser uploads directly to R2.
4. Browser confirms; server writes the `Document` row.

Validate MIME type and size **server-side before signing** : the presigned URL is a permission slip, so the check has to happen before you write it. Cap at 5MB for images, 10MB for PDFs; allow JPEG, PNG, WebP and PDF only.

```bash
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

R2 speaks the S3 API, so the AWS SDK works unchanged : you only point it at your R2 endpoint.

---

## 9. THE TEN PHASES

Every phase has the same shape: **Goal → Why now → What you build → Concepts explained simply → Mistakes to avoid → Definition of Done → Claude Code prompt.**

Do not move on until every Definition-of-Done box is ticked and committed.

**When each piece of infrastructure enters the build:**

| Service | Introduced | Expanded |
|---|---|---|
| Neon + Prisma | Phase 2 | Phase 7 (transactions) |
| Auth.js | Phase 3 | Phase 9 (platform TOTP) |
| **Redis** | Phase 3 (rate limiting) | Phase 4 (KPI cache) · 7 (locks) · 8 (idempotency) · 9 (flags) |
| **R2** | Phase 5 (property photos) | Phase 6 (private documents) |
| **QStash** | Phase 7 (invoice fan-out) | Phase 8 (reconcile) · 9 (email) |
| Daraja | Phase 8 | : |
| Go service | Phase 10 | : |

---

### PHASE 1 : Foundation, Tailwind v4, Preline and the Design System

**Goal:** A running Next.js app with Preline wired correctly, your tokens live, your icon registry verified, and the whole thing deployed : before any feature exists.

**Why now:** Design tokens are load-bearing. Build twelve screens with hard-coded colours and *then* introduce tokens, and you rewrite twelve screens. Deploying an empty app on day one also proves your pipeline works while the stakes are zero.

**What you build**

1. `npx create-next-app@latest silqu --typescript --eslint --app --src-dir --import-alias "@/*"` (decline the Tailwind prompt : you will install v4 manually).
2. Tailwind v4: `npm i tailwindcss @tailwindcss/postcss postcss` and a `postcss.config.mjs` with the `@tailwindcss/postcss` plugin.
3. `npm i preline @tailwindcss/forms @iconify/react`.
4. `globals.css` exactly as in §2.2 : Tailwind import, Preline `@source` + `variants.css`, forms plugin, the full `@theme` token block, the three `[data-portal]` overrides, base styles and the global focus ring.
5. Fonts via `next/font/google`: Sora, Inter, IBM Plex Mono, exposed as `--font-display`, `--font-body`, `--font-mono`.
6. `PrelineClient` component (§7.1) mounted at the end of the root layout body.
7. `src/lib/icons.ts` : the icon registry : plus `src/components/ui/icon.tsx` wrapping Iconify.
8. `scripts/verify-icons.mjs`, wired into an `npm run verify:icons` script **and into CI**.
9. `src/lib/money.ts` : `toCents`, `fromCents`, `formatKES` : and `src/components/ui/money.tsx`.
10. First wave of Preline-wrapped primitives, token-swapped per §7.2: `button`, `input`, `select`, `textarea`, `checkbox`, `switch`, `badge`, `card`, `modal`, `dropdown`, `toast`, `skeleton`, `spinner`, `empty-state`.
11. A `/design-system` page rendering every component in every state, in all three portal themes. **This page is a deliverable : screenshot it for your documentation.**
12. GitHub → Vercel → confirm the live URL.

**Concepts explained simply**

- *Design token:* a name for a value. Instead of `#14527A` in ninety files, you write `bg-primary` and the value lives in one place : like saving a phone number under a contact name rather than memorising digits.
- *Tailwind v4's `@theme`:* your token list *is* the config. Declaring `--color-navy-700` creates `bg-navy-700`, `text-navy-700`, `border-navy-700` automatically. There is no second config file to drift.
- *Why Preline needs a client component:* Preline reads the browser's DOM after React has rendered. Server Components have no DOM. So initialisation must live behind a `"use client"` boundary and run after hydration.
- *Why re-init on route change:* App Router swaps page markup without reloading. New markup has no Preline behaviour attached until you scan again. `usePathname()` is the trigger.
- *The Money component:* `<Money cents={1450000} />` renders `KES 14,500.00` in IBM Plex Mono with tabular figures. Because it is one component, money can never be formatted inconsistently anywhere in SILQU.

**Mistakes to avoid**

- ❌ Using `@theme inline` : portal theming silently stops working.
- ❌ Pasting Preline markup with its stock `blue-600` / `gray-500` classes. Run the §7.2 swap every time.
- ❌ Forgetting `@tailwindcss/forms`. Every Preline form component depends on it and will look broken without it.
- ❌ Putting `PrelineClient` at the top of the body : content must exist before the scan.
- ❌ Importing `@iconify/react` directly in a page instead of going through the registry.
- ❌ Committing `.env.local`. Add it to `.gitignore` in the **first** commit.
- ❌ Deploying at the end of the project instead of the beginning.

**Definition of Done**
- [ ] App runs locally and is live on Vercel
- [ ] `/design-system` shows every primitive in default, hover, focus, disabled and error states
- [ ] The same page renders correctly under all three `data-portal` values
- [ ] A Preline dropdown and modal still work **after client-side navigation** (this is the real test)
- [ ] `npm run verify:icons` passes and runs in CI
- [ ] Gold focus ring visible on every control via keyboard
- [ ] No raw Tailwind palette colour anywhere in `src/components/**`

**Claude Code prompt**

```
Phase 1 only : Foundation, Tailwind v4, Preline, design system.

Read docs/SILQU_BUILD_PLAN_V2.md sections 2 and 7.

Build:
1. Next.js 14 App Router, TypeScript strict, src/ dir, @/* alias.
2. Tailwind CSS v4 via @tailwindcss/postcss. No tailwind.config.ts.
3. Install preline, @tailwindcss/forms, @iconify/react.
4. globals.css exactly as in section 2.2: tailwindcss import, Preline @source +
   variants.css, @plugin forms, the full @theme token block (plain @theme, NOT
   @theme inline), the three [data-portal] overrides, base styles, focus ring.
5. Fonts: Sora / Inter / IBM Plex Mono via next/font/google.
6. src/components/ui/preline-client.tsx using preline/non-auto + usePathname,
   mounted at the END of the root layout body.
7. src/lib/icons.ts icon registry + src/components/ui/icon.tsx wrapper.
8. scripts/verify-icons.mjs hitting the Iconify API; npm run verify:icons.
9. src/lib/money.ts and src/components/ui/money.tsx (IBM Plex Mono,
   tabular-nums, muted KES prefix, right-aligned, tones default/positive/negative).
10. Preline-based primitives, token-swapped per section 7.2: button, input,
    select, textarea, checkbox, switch, badge, card, modal, dropdown, toast,
    skeleton, spinner, empty-state.
11. /design-system page showing every component in every state, with a
    portal-theme switcher.

Constraints:
- No hex codes in any component. Tokens only.
- No stock Tailwind palette classes (blue-, gray-, red-, green-) in src/components.
- Every interactive element gets the global gold focus ring.
- Verify a Preline dropdown still opens AFTER a client-side route change.
- No database, no auth, no business logic in this phase.

Show me your plan before writing code.
```

---

### PHASE 2 : Data Layer: Neon + Prisma

**Goal:** Every model from §5 exists in Neon with its constraints, plus a seed script full of realistic Kenyan data.

**Why now:** The schema is the skeleton. Every screen afterwards is shaped by it. Renaming a column in week 2 takes five minutes; in week 8 it touches forty files.

**What you build**

1. Neon project with two branches: `main` (production) and `dev`. Copy pooled and unpooled connection strings for both.
2. `npm i @prisma/client @prisma/adapter-neon @neondatabase/serverless` and `npm i -D prisma tsx`.
3. `prisma/schema.prisma` : `driverAdapters` preview feature, `url` pooled, `directUrl` unpooled, every model from §5.4, every enum, `Int` money columns named `*Cents`, `onDelete: Restrict` on all financial relations.
4. `npx prisma migrate dev --name init`, then **read the generated SQL** before applying.
5. `npx prisma migrate dev --create-only --name partial_indexes` and hand-write the SQL from §5.5.
6. `src/server/db/client.ts` : the singleton with the Neon adapter (§5.6).
7. `prisma/seed.ts`: 1 platform admin, 1 organization, 1 manager, 2 employees (finance + care), 1 caretaker, 3 properties, 24 units, 18 tenants with leases, 3 months of invoices mixing paid / partial / overdue, payments with M-Pesa receipt codes, 6 maintenance requests, 3 announcements. Real Kenyan names, estates, `+2547…` numbers, KES amounts.
8. Query helpers in `src/server/db/queries/` : **every exported function takes `orgId` first**.
9. Export the ERD from Prisma (`prisma-erd-generator`) or dbdiagram.io into `docs/` for your SDS chapter.

**Concepts explained simply**

- *ORM:* a translator. You write `db.unit.findMany({ where: { propertyId } })` and it writes the SQL. Turn on query logging in dev so you can see what it wrote : that is how you keep learning SQL while using an ORM.
- *Migration:* a numbered, permanent, committed instruction for changing the database. This is how your laptop and Vercel stay identical. **Never edit the live database by hand.**
- *Pooled vs direct connection:* the app uses the pooled string because serverless functions come and go constantly and would otherwise exhaust connections. Migrations use the direct string because pooling breaks schema changes. Getting these swapped produces confusing errors : comment them in the schema.
- *Seed data:* fake but realistic rows so screens have something to show. Realism is not vanity : a demo full of "Test Tenant 1" reads as unfinished.
- *Index:* a book's index. Without one, Postgres reads every row. Index every foreign key and every column you filter by.
- *Neon branching:* a copy-on-write clone of your database in seconds. Test a scary migration on a branch and throw it away if it goes wrong.

**Mistakes to avoid**

- ❌ `Float` or `Decimal` for money. `Int` cents. (And never `BigInt` on a per-row column : you will meet the serialisation error.)
- ❌ Forgetting `orgId` on a model. Retrofitting a multi-tenant column later is miserable.
- ❌ `DateTime` without timezone thinking. Store UTC, display `Africa/Nairobi`.
- ❌ `onDelete: Cascade` on anything financial. Use `Restrict` and archive.
- ❌ Not committing `prisma/migrations/`. Those SQL files *are* your schema history.
- ❌ Creating a new `PrismaClient` per request. Use the singleton.
- ❌ Running migrations against `main` while experimenting. That is what `dev` is for.

**Definition of Done**
- [ ] `npx prisma studio` shows every model from §5.4
- [ ] All partial indexes and CHECK constraints exist **and are proven** : try inserting a duplicate invoice period and a second active lease; both must fail
- [ ] `npm run db:seed` produces a believable dataset
- [ ] Every query helper requires `orgId`
- [ ] ERD exported into `docs/`
- [ ] Query logging visible in dev

**Claude Code prompt**

```
Phase 2 only : Data layer with Neon + Prisma.

Read docs/SILQU_BUILD_PLAN_V2.md section 5.

Build:
1. prisma/schema.prisma with driverAdapters preview feature, url = pooled
   DATABASE_URL, directUrl = DATABASE_URL_UNPOOLED (comment which is which).
2. Every model in section 5.4, every enum, every relation.
   - Money: Int columns named *Cents. NEVER BigInt or Decimal on a row column.
   - All financial relations onDelete: Restrict.
   - Prisma-expressible uniques from section 5.5.
   - Indexes on every FK plus Invoice.status, Lease.status, Unit.status,
     Payment.paidAt, AuditLog.createdAt, and (orgId, createdAt) composites.
3. migrate dev --name init, then a --create-only migration containing the
   hand-written partial indexes and CHECK constraints from section 5.5.
   Comment each constraint with the bug it prevents.
4. src/server/db/client.ts : Prisma singleton with PrismaNeon adapter and
   dev query logging.
5. prisma/seed.ts with the realistic Kenyan dataset described in Phase 2.
6. src/server/db/queries/{properties,tenants,leases,invoices,payments}.ts :
   orgId is the first parameter of every exported function.
7. npm scripts: db:migrate, db:seed, db:studio, db:reset.

Constraints:
- No UI in this phase.
- Prove the constraints work: include a script that attempts a duplicate
  invoice period and a second ACTIVE lease and asserts both are rejected.

Show me the schema before generating migrations.
```

---

### PHASE 3 : Authentication, RBAC and Portal Isolation

**Goal:** Six roles enter through three separate doors, land in the correct portal, and cannot reach any other.

**Why now:** Every feature after this asks "who is asking, and from where?" Build the answer once, properly, before forty features each invent their own.

**What you build**

1. Auth.js v5, Credentials provider, JWT sessions carrying `{ userId, orgId, role, subRole, portal }`.
2. **Three cookie configurations** : `silqu.biz` (8h), `silqu.my` (30d), `silqu.platform` (15min idle) : with distinct names so a cookie from one portal is not even parsed by another.
3. `src/middleware.ts` : portal resolution by host in production and path in development (§3.4), session lookup for that portal only, role gate, redirect with a `?reason=` code.
4. Three login pages, each rejecting the wrong role with a helpful cross-link:
   - `/login` : MANAGER, EMPLOYEE, CARETAKER
   - `/my/login` : TENANT
   - `/platform/login` : PLATFORM_ADMIN, PLATFORM_SUPPORT, **plus TOTP** using Preline's PIN Input
5. `src/server/auth/password.ts` : bcrypt cost 12, and `generateTempPassword()` using `crypto.randomBytes`.
6. `src/server/auth/totp.ts` : `otplib` or `@epic-web/totp`, secret stored encrypted, enrolment with a QR code.
7. Manager sign-up at `/signup`: organization → account → plan → `Subscription` with status `PENDING`. **M-Pesa is stubbed** : `initiateSubscriptionPayment()` returns a fake success in dev. Phase 8 replaces the stub behind the same interface.
8. Staff onboarding: manager creates staff → temp password generated → Resend email → `mustChangePassword = true` → first login forcibly redirects to `/set-password` (Preline **Strong Password** component).
9. Tenant invitations: random token, **hashed** before storage, raw token in the emailed link, 72-hour expiry, single use, `/my/accept-invite` sets the tenant's own password and links `Tenant.userId`.
10. Forgot / reset password with 1-hour hashed tokens.
11. **Redis rate limiting** on login (5 / 15 min per email+IP), invitation send, and password reset.
12. `src/server/auth/session.ts` : `getCurrentUser`, `requireUser`, `requireRole(roles)`, `requirePortal(portal)`, `requireOrg()`.
13. `src/server/auth/permissions.ts` : `can(user, action, resource)` encoding the §6.2 matrix, with a unit test per cell.
14. Audit log rows for: login success, login failure, password change, TOTP enrolment, invitation sent, invitation accepted, lockout.

**Concepts explained simply**

- *Hashing vs encryption:* encryption can be reversed; hashing cannot. A password hash is a one-way fingerprint : you hash what the user typed and compare fingerprints. That is why no legitimate service can email you your existing password.
- *Salt:* random data mixed into the hash so two people with the password `1234` get different hashes. bcrypt salts automatically.
- *Cost factor 12:* bcrypt is deliberately slow, around 250ms per hash. Fine for one login; ruinous for an attacker trying millions.
- *JWT session:* a signed note in a cookie saying "user 42, role MANAGER, portal business". Signed means the user cannot edit it : change one character and the signature breaks.
- *httpOnly cookie:* JavaScript cannot read it, so a cross-site scripting bug cannot steal the session.
- *TOTP:* the six-digit code from an authenticator app. Server and phone share a secret and both compute a code from the current 30-second window. Possession of the phone becomes a second factor, so a stolen platform password alone is not enough.
- *Why hash invitation tokens:* if your database ever leaks, raw tokens would let an attacker accept every pending invitation. Hashed tokens are useless to them.
- *Why three separate cookies:* a cookie is scoped to a name and a path. Three names means a tenant cookie is not merely rejected at the platform door : it is not even read.

**Mistakes to avoid**

- ❌ Trusting a role claimed by the client. The role comes from the database at login, is signed into the token, and is re-read server-side on every request.
- ❌ Checking permissions only in the UI. Type `/app/staff` as a caretaker; if you see a page, layer 2 is missing.
- ❌ Logging passwords, temp passwords or tokens. Ever. Not even in dev : habits transfer.
- ❌ Telling the login form *which* field was wrong. Say "Email or password is incorrect", or you have built an account-enumeration tool.
- ❌ One cookie for all three portals. This is the whole point of the design.
- ❌ Forgetting to invalidate sessions when a user is deactivated or an org is suspended.
- ❌ Rate limiting per IP only. Kenyan users often share NAT'd mobile IPs; limit per email **and** IP.

**Definition of Done**
- [ ] All six roles log in through the correct door and land in the correct portal
- [ ] A caretaker at `/app/staff` gets 403, not a page
- [ ] A tenant at the business login is told to use the tenant portal, with a link
- [ ] The platform login requires TOTP and expires after 15 minutes idle
- [ ] Copying a tenant cookie to the platform host does nothing
- [ ] Temp-password staff cannot navigate anywhere until they set a new password
- [ ] An invitation link works exactly once and expires after 72 hours
- [ ] Six failed logins in ten minutes triggers the rate limit
- [ ] `tests/unit/permissions.test.ts` covers every cell of §6.2
- [ ] `tests/e2e/portal-isolation.spec.ts` passes

**Claude Code prompt**

```
Phase 3 only : Authentication, RBAC, portal isolation.

Read docs/SILQU_BUILD_PLAN_V2.md sections 3 and 6.

Build:
1. Auth.js v5 Credentials + JWT carrying { userId, orgId, role, subRole, portal }.
   bcrypt cost 12.
2. THREE cookie configs with distinct names and lifetimes:
   silqu.biz (8h), silqu.my (30d), silqu.platform (15min idle).
3. src/middleware.ts: resolve portal by host in production and path prefix in
   development; read only that portal's cookie; gate by role; redirect with
   a ?reason= code.
4. Three login pages: /login, /my/login, /platform/login.
   Platform adds a TOTP step using Preline PIN Input.
   All three use Preline Toggle Password.
5. /signup: org -> manager account -> plan -> Subscription PENDING.
   Stub initiateSubscriptionPayment() behind a clean interface for Phase 8.
6. Staff onboarding with crypto-random temp password, bcrypt-hashed, emailed
   via Resend, mustChangePassword = true, forced /set-password using Preline
   Strong Password.
7. Tenant invitations: store ONLY the token hash, 72h expiry, single use,
   /my/accept-invite sets the tenant's own password and links Tenant.userId.
8. Forgot/reset password with 1h hashed tokens.
9. Upstash Redis rate limiting: login 5/15min per email+IP, plus invite send
   and password reset.
10. src/server/auth/session.ts: getCurrentUser, requireUser, requireRole,
    requirePortal, requireOrg.
11. src/server/auth/permissions.ts implementing the section 6.2 matrix, with a
    Vitest case per cell.
12. Audit log on login success/failure, password change, TOTP enrolment,
    invite sent/accepted, lockout.

Constraints:
- Never log or email a plaintext password except the one-time temp password.
- Login errors must not reveal whether the email exists.
- Every server action starts with requireRole.
- Write tests/e2e/portal-isolation.spec.ts proving all five rules in section 6.3.

Show me the auth and portal-routing flow before writing code.
```

---

### PHASE 4 : Three Portal Shells and Role Dashboards

**Goal:** All three portals have a real, navigable, correctly-themed home. The system becomes visible.

**Why now:** This is the first phase where SILQU looks like a product. It settles navigation before twenty pages exist, and it gives you screenshots for your progress report.

**What you build**

1. `business-shell.tsx` : Preline **Sidebar** + topbar with SearchBox, notification bell and user dropdown; `data-portal="business"`.
2. `tenant-shell.tsx` : Preline **Navbar** + mobile bottom bar; `data-portal="tenant"`; larger touch targets, fewer options.
3. `platform-shell.tsx` : dark ops shell, dense, Preline **KBD** hints for keyboard shortcuts; `data-portal="platform"`.
4. **Config-driven navigation** in `src/lib/nav.ts`: each item is `{ href, label, icon, portal, roles[], subRoles? }`. Each shell filters by session. The caretaker entry reads `label: "My Units"` where the manager's reads `"Properties"` : same route, different label, one config.
5. Dashboards per role, fed by **real seeded data**:
   - **Manager:** properties, occupied vs vacant, expected vs collected this month, arrears total, 6-month collection chart, occupancy donut, recent payments
   - **Employee: Finance:** collections today, unpaid invoices, arrears ageing
   - **Employee: Customer Care:** open maintenance, new tenants this month, unanswered complaints
   - **Caretaker:** my units, occupancy among them, open maintenance on my units
   - **Tenant:** current balance as the hero number, next due date, last payment, open requests
   - **Platform:** organizations, active subscriptions, MRR, sign-ups this month, failed jobs, 24h M-Pesa failure rate
6. **Redis KPI cache** : 60-second TTL per org dashboard, busted on any invoice or payment write.
7. Shared blocks: `page-header`, Preline **Breadcrumb**, `kpi-card`, `data-table` (TanStack logic + Preline table markup), `empty-state`, `loading.tsx` skeletons.
8. Charts: `react-apexcharts` wrapped in `dynamic(..., { ssr: false })`.

**Concepts explained simply**

- *Route group:* the parentheses in `(business)` mean "share a layout, but keep the word out of the URL". That is how three portals get three chromes from one deployment.
- *Server Component:* renders on the server, can `await` a query directly, ships no JavaScript for itself. Dashboards should be Server Components. Only mark a file `"use client"` when you need state, effects or event handlers : a chart, a dropdown, a form.
- *`loading.tsx`:* Next.js shows it automatically while a Server Component's data loads. Skeletons here are why a good app feels fast even when it is not.
- *Config-driven nav:* the menu is data, not markup. Adding an item is one line, and permissions come from the same array, so they cannot drift apart.
- *Cache busting:* the cached dashboard must be deleted the instant a payment lands, or a manager records KES 20,000 and the number does not move for a minute. Delete the key inside the same code path as the write.

**Mistakes to avoid**

- ❌ Marking the whole layout `"use client"` to fix one interactive element. Push the boundary down to the smallest leaf.
- ❌ Fetching dashboard data in `useEffect` : flash of empty state, slower page.
- ❌ Building desktop-first. Kenyan property managers are on phones. Design at 360px.
- ❌ Duplicating the sidebar per role. One component, filtered config.
- ❌ Hard-coded KPI numbers. Wire them to seeded data now, or you will demo a lie.
- ❌ Importing ApexCharts without `ssr: false` : it touches `window` and breaks the build.
- ❌ Caching a dashboard without a bust path.

**Definition of Done**
- [ ] Three shells render with correct theming and correct hosts/paths
- [ ] Nav items appear and disappear correctly for all six roles and three sub-roles
- [ ] Caretaker nav reads "My Units"
- [ ] Every dashboard shows live seeded numbers
- [ ] Every list has a designed empty state
- [ ] Usable at 360px
- [ ] KPI cache demonstrably busts on a payment write

**Claude Code prompt**

```
Phase 4 only : Three portal shells and role dashboards.

Read docs/SILQU_BUILD_PLAN_V2.md sections 3, 6 and 7.

Build:
1. Three shells using Preline Sidebar (business), Navbar + mobile bottom bar
   (tenant), dark dense ops shell with KBD hints (platform).
   Each sets data-portal on its layout root.
2. src/lib/nav.ts config: { href, label, icon, portal, roles[], subRoles? }.
   Shells filter by session. CARETAKER sees "My Units" where MANAGER sees
   "Properties" : same route, different label, one config entry.
3. Dashboards for MANAGER, EMPLOYEE (both sub-roles), CARETAKER, TENANT,
   PLATFORM_ADMIN with the KPI sets listed in Phase 4. Real queries only.
4. Redis KPI cache, 60s TTL, key kpi:{orgId}:dashboard, busted on invoice
   and payment writes.
5. Shared: page-header, Preline Breadcrumb, kpi-card, data-table
   (TanStack Table logic + Preline table markup: sort, paginate,
   column visibility), empty-state, loading.tsx skeletons.
6. Charts via react-apexcharts with dynamic(..., { ssr: false }):
   6-month collection bars, occupancy donut.

Constraints:
- Dashboards are Server Components; "use client" only on charts and menus.
- Mobile-first, verified at 360px.
- Icons only via the ICONS registry.
- No CRUD forms in this phase : navigation and read-only dashboards only.
```

---

### PHASE 5 : Properties, Units and R2 Uploads

**Goal:** Full lifecycle for properties and units, with caretaker scoping proven by an automated test.

**Why now:** Properties and units are the root of the data tree : a tenant cannot exist without a door to live behind.

**What you build**

1. Properties: list (Preline SearchBox + filters by county and status), create, detail, edit, archive.
2. Property detail: summary card, occupancy **Progress** bar, unit grid, photo, assigned caretakers (**Avatar Group**).
3. Optional but excellent: Preline **Tree View** as a property → unit explorer in the sidebar.
4. Units: single create, **bulk create** via Preline **Stepper** ("add 12 units named A1–A12 at KES 14,500"), edit, status change.
5. Unit detail: current lease, tenant, recent payments, maintenance history.
6. Caretaker assignment UI : property-level and unit-level.
7. **The scoping test:** a caretaker's unit list returns only assigned units, and a direct URL to an unassigned unit returns 403 : proven by Playwright, not by clicking around.
8. **R2 uploads:** presigned PUT flow (§8.3) using Preline **File Upload** and **File Uploading Progress**. Public bucket, 5MB cap, JPEG/PNG/WebP only, validated server-side before signing.
9. Audit log on create, update, archive, status change.

**Concepts explained simply**

- *Server Action:* a function marked `"use server"` that a form calls directly : Next.js handles the round trip. But being server code does not make it trusted: anyone can invoke it, so it must still validate input and check permissions.
- *Optimistic update:* show the change immediately, roll back if the server refuses. `useOptimistic` makes status toggles feel instant.
- *`revalidatePath`:* after a write, tell Next.js the cached `/app/properties` is stale. Forget it and users see old lists and assume the app is broken.
- *Presigned upload:* your server tells R2 "let this person upload one file, to this key, in the next five minutes". The file goes browser → R2 directly, never through your server. Cheaper, faster, and your server never handles a 5MB blob.
- *Transactional bulk create:* generating A1…A12 in one transaction means that if unit 7 fails, all twelve roll back. A half-created building is worse than none.

**Mistakes to avoid**

- ❌ Validating only in the browser. Re-validate with the same Zod schema server-side.
- ❌ Allowing a unit with an active lease to be archived. Block it: *"This unit has an active lease. End the lease before archiving the unit."*
- ❌ Forgetting `revalidatePath` after a mutation.
- ❌ Enforcing caretaker scope only by hiding menu items.
- ❌ Storing rent as `"14,500"` : a string with a comma. `toCents` at the boundary, always.
- ❌ Signing an upload URL before validating MIME type and size. The signature *is* the permission.
- ❌ Storing the R2 URL instead of the key.

**Definition of Done**
- [ ] Full property and unit lifecycle works
- [ ] Bulk unit creation is transactional
- [ ] Caretaker sees only assigned units; direct URL to another returns 403
- [ ] Unit status change immediately updates property occupancy
- [ ] Photo upload works end to end with limits enforced
- [ ] `property-crud.spec.ts` and `caretaker-scope.spec.ts` pass

**Claude Code prompt**

```
Phase 5 only : Properties, Units, R2 uploads.

Read docs/SILQU_BUILD_PLAN_V2.md sections 5, 6, 7 and 8.3.

Build:
1. Properties: list (search + county/status filters), create, detail, edit,
   archive. Preline Card, SearchBox, Offcanvas for mobile filters.
2. Property detail: occupancy Progress bar, unit grid, photo,
   assigned caretakers via Avatar Group.
3. Units: single create, bulk create using Preline Stepper (prefix + range +
   shared rent, in ONE transaction), edit, status change.
4. Unit detail: current lease, tenant, recent payments, maintenance history.
5. Caretaker assignment UI (property-level and unit-level).
6. R2 upload: POST /api/uploads/sign validates permission, MIME type and size
   BEFORE returning a presigned PUT URL (5 min expiry). Browser uploads
   direct to R2. Store the KEY, not the URL. Preline File Upload +
   File Uploading Progress. Max 5MB, JPEG/PNG/WebP only.
7. Server actions in src/server/actions/property.actions.ts, each starting with
   requireRole and re-validating with the Zod schema.
8. Audit log on every mutation.

Constraints:
- Caretaker scope enforced in the QUERY layer, not the UI.
- Archiving a unit with an ACTIVE lease must fail with a friendly message.
- revalidatePath after every mutation, and bust the Redis KPI cache.
- Playwright: property-crud.spec.ts and caretaker-scope.spec.ts.
```

---

### PHASE 6 : Tenants, Leases and Invitations

**Goal:** A manager onboards a real tenant end to end : record, unit, lease, invitation : and the tenant sets their own password and logs into their portal.

**Why now:** Leases bridge property data and money data. Nothing in Phase 7 can be generated without an active lease.

**What you build**

1. Tenants: list, create, detail, edit, archive. Phone normalised to `254XXXXXXXXX` on save, displayed as `+254 7XX XXX XXX`.
2. Tenant detail using Preline **Tabs**: Ledger · Lease · Requests · Documents.
3. **The ledger view** : invoices and payments merged chronologically with a running balance, rendered with Preline **Timeline**. This is the single most useful screen in the product for a landlord. Give it real attention.
4. Leases: creation wizard using Preline **Stepper** (vacant unit → tenant via **ComboBox** → dates via **Datepicker** → rent → deposit → billing day), detail, renew, end, terminate.
5. **The lease-creation transaction:** insert lease + set unit `OCCUPIED` + record deposit + audit log : all or nothing.
6. Lease state machine `PENDING → ACTIVE → ENDED | TERMINATED`, with invalid transitions rejected in code.
7. Invitation flow end to end, plus a pending-invitations list with resend and revoke.
8. **Private R2 documents:** tenant ID scans and signed lease PDFs go to `silqu-private`, fetched only via 5-minute signed URLs, with an audit row per fetch.
9. Business rules: cannot lease an occupied unit; end date must follow start date; ending a lease frees the unit and surfaces any outstanding balance; `billingDay` defaults to 1 but is per-lease configurable.

**Concepts explained simply**

- *Transaction:* a set of changes that all succeed or all fail. Creating a lease without marking the unit occupied would leave the system lying about occupancy. `db.$transaction(async (tx) => { … })` makes that impossible.
- *State machine:* draw the allowed transitions and refuse everything else. Without one, you eventually get a lease that is somehow both ended and active.
- *Why tenants set their own password:* the manager never knows it, so a dispute can never be "the landlord logged in as me." That is a real legal argument and worth a sentence in your viva.
- *Signed read URL:* the private-bucket equivalent of a presigned upload : a temporary permission slip to read one object. It expires, so a leaked link is worthless within minutes.
- *Phone normalisation:* `0712345678`, `+254712345678` and `254712345678` are one person. Store one canonical form, display the friendly one. Skip this and you will create duplicate tenants and fail M-Pesa lookups.

**Mistakes to avoid**

- ❌ Creating the lease and updating the unit in two separate writes.
- ❌ Relying only on the partial index for double-letting. Check in application code too, so the user gets a friendly message rather than a database error.
- ❌ Deleting a tenant. Archive : their payment history is a financial record.
- ❌ Putting an ID scan in the public bucket. This is the DPA-breach mistake.
- ❌ Invitation emails with no expiry note. Tell the tenant it lasts 72 hours.
- ❌ Dates as strings. Use `DateTime`, convert at the edges, display in `Africa/Nairobi`.

**Definition of Done**
- [ ] Full tenant onboarding works end to end on the live URL
- [ ] Lease creation is transactional and updates unit status
- [ ] Two active leases on one unit is impossible, with a friendly error
- [ ] Ending a lease frees the unit and surfaces any balance
- [ ] Invitations expire, resend, revoke, and work exactly once
- [ ] Tenant ledger shows a correct running balance
- [ ] A private document is unreachable without a signed URL, and each fetch is audited
- [ ] `tenant-onboarding.spec.ts` passes

**Claude Code prompt**

```
Phase 6 only : Tenants, Leases, Invitations.

Read docs/SILQU_BUILD_PLAN_V2.md sections 5, 6, 7 and 8.3.

Build:
1. Tenants: list (search by name/phone/unit), create, detail, edit, archive.
   Phone normalised to 254XXXXXXXXX, displayed +254 7XX XXX XXX.
2. Tenant detail with Preline Tabs: Ledger / Lease / Requests / Documents.
   Ledger merges invoices and payments chronologically with a running balance,
   rendered with Preline Timeline.
3. Lease creation wizard using Preline Stepper: vacant unit -> tenant
   (Preline ComboBox) -> dates (Preline Datepicker) -> rent -> deposit ->
   billing day. Plus detail, renew, end, terminate.
4. Lease creation MUST be one transaction: insert lease + set unit OCCUPIED +
   record deposit + audit log.
5. State machine PENDING -> ACTIVE -> ENDED|TERMINATED, invalid transitions
   rejected in code.
6. Tenant invitation flow (hashed token, 72h, single use) + pending list with
   resend and revoke.
7. Private R2 bucket for ID scans and signed lease PDFs; reads only via
   5-minute signed URLs; AuditLog row per private-document fetch.

Constraints:
- Zod .refine for endDate > startDate and rent > 0.
- Two ACTIVE leases on one unit must fail with a friendly message, not a
  database error.
- Archive, never delete, any tenant with financial history.
- Playwright: tenant-onboarding.spec.ts covering invite -> accept -> login.
```

---

### PHASE 7 : Billing Engine and QStash Background Jobs

**Goal:** The financial heart of SILQU. Invoices generate automatically on a real queue, payments allocate correctly, arrears are always accurate.

**Why now:** This is the feature landlords actually pay for. It needs leases (Phase 6) and must exist before M-Pesa (Phase 8), because M-Pesa is only a *way of receiving* a payment this phase already knows how to record.

**What you build**

**7a : The billing engine**
1. `generate-invoices.ts` : for one org and one period, find every `ACTIVE` lease, create one invoice each, with lines for rent plus any recurring charges. Due date from `lease.billingDay`. **Idempotent** via `@@unique([leaseId, periodYear, periodMonth])`.
2. Manual trigger for the manager: pick month → **preview** (count, total, per-property breakdown) → confirm → run.
3. **Redis distributed lock** `lock:invoices:{orgId}:{yyyy-mm}` so two simultaneous clicks cannot both start.
4. `allocate-payment.ts` : the trickiest logic in the project:
   - Oldest unpaid invoice first (FIFO)
   - Partially settle if short; overflow to the next invoice if long
   - Leftover becomes a credit on the tenant's account
   - Update `paidCents`, `balanceCents`, `status` on every affected invoice
   - Entirely inside one transaction, with `{ maxWait, timeout }` set explicitly
5. `compute-arrears.ts` : ageing into 0–30 / 31–60 / 61–90 / 90+ buckets.
6. Invoice list (filters by property, status, period, with a totals row) and invoice detail (lines in a Preline **Accordion**, payment history, balance, PDF, email).
7. Record-payment form : MANAGER and EMPLOYEE:FINANCE only. Tenant → amount → method → reference → date.
8. Receipt PDF via `@react-pdf/renderer`, emailed **after** the transaction commits.
9. Arrears page with ageing buckets, sortable, CSV export via `papaparse`.

**7b : QStash**
10. `src/server/services/queue/client.ts` : publish helpers.
11. `verifySignatureAppRouter` on **every** `/api/jobs/*` route.
12. Fan-out chain: `generate-invoices` → one message per org → one message per invoice email.
13. Schedules created by `scripts/qstash-schedules.mjs`: invoices (1st 06:00), arrears reminders (5th 08:00), lease expiry (daily 00:30), subscription renewals (daily 07:00).
14. Unit tests: allocation edge cases, invoice idempotency, job handler idempotency.

**Concepts explained simply**

- *Idempotency:* an operation you can safely repeat. Pressing a lift button five times summons one lift. Your invoice job must behave the same, because queues retry, networks fail mid-run, and managers double-click.
- *FIFO allocation:* oldest debt first. A tenant owes June (KES 5,000 short) and July (KES 14,500) and pays KES 16,000 → June clears, July receives KES 11,000, KES 3,500 remains. **Write that exact example into a test** : it is precisely what an examiner will ask you to trace.
- *Ageing buckets:* debt sorted by age. KES 5,000 outstanding for three months is a far worse signal than KES 20,000 from last week. Standard accounts-receivable practice, and it makes your reports look professional.
- *Distributed lock:* `SET key value NX EX 300` : "set this only if nobody else has". The first click wins; the second is told the run is already in progress. Without it, two simultaneous runs race and one crashes on the unique constraint mid-way.
- *Why preview before generating:* creating 200 invoices is easy; un-creating them is not. Any bulk financial operation shows a summary and asks for confirmation.
- *Derived vs stored balance:* `balance` could be computed every read or stored. We store it **and** recompute it inside the same transaction as the payment, so reports stay fast and the number stays true. Never let the two drift.
- *Prisma's 5-second transaction timeout:* the default. Allocating one payment is fine; a bulk operation is not. Pass `{ maxWait: 5000, timeout: 20000 }` : this one bites people in exactly this phase.

**Mistakes to avoid**

- ❌ Floating-point money. (Third and final warning.)
- ❌ A non-idempotent invoice job. Double-billing is the worst possible demo failure.
- ❌ Allocating a payment outside a transaction. A crash halfway leaves money recorded with no invoice updated : the books stop balancing.
- ❌ Assuming one payment settles exactly one invoice. Real tenants pay round numbers and part-payments.
- ❌ Silently discarding overpayment. Model it as a credit.
- ❌ An unsigned `/api/jobs/*` route. That is an open "bill everyone" button on the public internet.
- ❌ Doing all orgs in one job handler. Fan out.
- ❌ Emailing receipts before the transaction commits.
- ❌ Leaving Prisma's transaction timeout at its default for bulk work.

**Definition of Done**
- [ ] Generating invoices twice for the same month creates no duplicates
- [ ] Preview matches exactly what gets created
- [ ] Two simultaneous generate clicks : one runs, one is told it is in progress
- [ ] Allocation passes every edge case, including the worked example above
- [ ] Overpayment produces a visible tenant credit
- [ ] Arrears ageing reconciles with tenant ledgers
- [ ] Receipt PDF generates and emails with the correct reference
- [ ] `/api/jobs/*` rejects an unsigned request
- [ ] A deliberately failing job lands in the QStash DLQ and can be replayed
- [ ] `invoice-payment.spec.ts` passes

**Claude Code prompt**

```
Phase 7 only : Billing engine + QStash background jobs.

Read docs/SILQU_BUILD_PLAN_V2.md sections 5, 8.1, 8.2 and Phase 7.

Build:
1. src/server/services/billing/generate-invoices.ts : idempotent generation for
   one org + one period, rent + recurring lines, due date from lease.billingDay.
2. Manager UI: pick month -> preview (count, total, per-property breakdown)
   -> confirm -> run. Guard with a Redis lock lock:invoices:{orgId}:{yyyy-mm}
   using SET NX EX 300.
3. src/server/services/billing/allocate-payment.ts : FIFO across invoices,
   partial and over payment, leftover becomes tenant credit, updates
   paidCents/balanceCents/status, ONE transaction with explicit
   { maxWait: 5000, timeout: 20000 }.
4. compute-arrears.ts with 0-30 / 31-60 / 61-90 / 90+ ageing.
5. Invoice list (property/status/period filters + totals row) and detail
   (lines in Preline Accordion, payments, balance, PDF, email).
6. Record-payment form for MANAGER and EMPLOYEE:FINANCE only.
7. Receipt PDF (@react-pdf/renderer) emailed AFTER commit, via a QStash job.
8. Arrears page with ageing buckets, sortable, CSV export (papaparse).
9. QStash: src/server/services/queue/client.ts publish helpers;
   verifySignatureAppRouter on EVERY /api/jobs/* route;
   fan-out chain generate-invoices -> per-org -> per-invoice-email;
   scripts/qstash-schedules.mjs creating the four schedules in Phase 7b.
10. Vitest: allocation (exact, under, over, multi-invoice, zero-balance, and
    the June 5,000 + July 14,500 pays 16,000 example), invoice idempotency,
    job-handler idempotency.

Constraints:
- All money is Int cents end to end.
- Every write path is transactional.
- Every job handler is idempotent and returns 2xx on permanent failure,
  5xx only when a retry could help.
- Job payloads carry IDs only; re-read state inside the handler.
```

---

### PHASE 8 : M-Pesa Daraja Integration

**Goal:** Real STK Push. A manager pays a subscription and a tenant pays rent from their phone, and SILQU records both automatically.

**Why now:** Phase 7 built everything M-Pesa needs to hand money to. Now replace the stub. This is deliberately isolated because Daraja is the most failure-prone part of the project.

**What you build**

1. Daraja sandbox: Consumer Key, Consumer Secret, Business Short Code, Passkey.
2. `mpesa/client.ts`:
   - `getAccessToken()` : OAuth, **cached in Redis** until just before expiry (one token, many function instances)
   - `initiateSTKPush({ phone, amountCents, accountRef, description, purpose })`
   - Password = base64(`ShortCode + Passkey + Timestamp`), timestamp `YYYYMMDDHHmmss` in **Africa/Nairobi**
   - Phone normalised to `254XXXXXXXXX`; amount converted from cents to whole shillings
3. **Before** calling Safaricom, insert an `MpesaTransaction` row with status `INITIATED`; store `checkoutRequestId` from the response.
4. `/api/mpesa/callback`:
   - Log the entire raw body to `rawCallback` **before** parsing anything
   - **Redis idempotency key** `idem:mpesa:{checkoutRequestId}` as the first gate; the `@unique` column is the backstop
   - If already `COMPLETED`, return 200 and stop : **duplicate callbacks are normal**
   - On `ResultCode 0`: extract `MpesaReceiptNumber`, amount, phone; create the payment and run the Phase 7 allocation engine, or activate the subscription : in one transaction
   - On non-zero: store `resultDesc`, mark `FAILED`, notify the user
   - **Always return HTTP 200**, or Safaricom retries forever
5. `/api/mpesa/timeout` : the queue timeout URL.
6. Polling UI: after initiating, poll `/api/stk-status/[checkoutId]` every 3s for up to 90s : *"Check your phone and enter your M-Pesa PIN"* → success / failed / *"Still processing : this page will update itself."* Cache the status in Redis so polling does not hammer Postgres.
7. **Redis rate limit** on STK Push: 3 per 5 minutes per phone. Each push costs money and annoys the tenant.
8. Two real use cases: manager subscription (`/signup` and `/app/settings/subscription`) and tenant rent (`/my/pay`, prefilled with the outstanding balance).
9. **QStash reconciliation sweep** every 30 minutes: find transactions stuck `INITIATED` for over 10 minutes and query their status from Daraja.
10. Reconciliation screen for the manager, and the raw webhook viewer with replay in the platform portal.
11. **Manual entry stays.** Cash, bank and offline M-Pesa still need recording. Never remove the manual path.

**Concepts explained simply**

- *STK Push:* your server asks Safaricom to make a PIN prompt appear on a specific phone. The user types their PIN on their handset. You never see it : that is the whole point.
- *Webhook / callback:* Safaricom does not answer immediately. Your first request only means "prompt sent." The real answer arrives seconds or minutes later as a *separate* HTTP request to your public URL. Your code must treat "I don't know yet" as a normal state, not an error.
- *Why log the raw callback first:* if the payload shape changes or your parser throws, you still hold the evidence. In payments, the raw record is sacred.
- *Two layers of idempotency:* Redis stops duplicate work from starting (fast, cheap); the database unique constraint guarantees correctness even if Redis is down (slow, absolute). Belt and braces, and you should be able to explain why you have both.
- *Sandbox vs production:* sandbox uses test short codes and a fixed test PIN; production needs a Go-Live application and a real paybill. **Build and defend on sandbox**, and say so openly in your documentation : that is the honest, expected position for a student project.
- *ngrok in development:* Safaricom must reach your callback over public HTTPS. `ngrok http 3000` gives your laptop a temporary public address. Update `MPESA_CALLBACK_URL` every time ngrok restarts.

**Mistakes to avoid**

- ❌ Treating the STK Push response as confirmation of payment. It only confirms the prompt was sent.
- ❌ Not handling duplicate callbacks.
- ❌ Returning 500 to Safaricom on your own internal error. Return 200, log it, handle it out of band.
- ❌ Wrong timezone in the password timestamp. Nairobi is UTC+3; a UTC timestamp gives an invalid password and a cryptic error.
- ❌ Phone in the wrong format. Daraja wants `254712345678` : no `+`, no leading `0`.
- ❌ Sending decimals. Daraja expects whole shillings; convert from cents and reject fractional amounts.
- ❌ Fetching a fresh OAuth token on every request. Cache it in Redis.
- ❌ Committing your Consumer Secret. If you ever do, **rotate it** : Git history is forever.
- ❌ Making M-Pesa the only way to record a payment.

**Definition of Done**
- [ ] Sandbox STK Push reaches a test phone
- [ ] Callback creates the payment and allocates it correctly
- [ ] Replaying the same callback three times produces exactly **one** payment
- [ ] Failed and cancelled payments show a clear message and are logged
- [ ] Subscription activates on successful payment
- [ ] Tenant rent payment updates the invoice and balance
- [ ] Stuck transactions are resolved by the reconciliation sweep
- [ ] Manual payment entry still works
- [ ] Every credential is in env vars, none in Git

**Claude Code prompt**

```
Phase 8 only : M-Pesa Daraja STK Push.

Read docs/SILQU_BUILD_PLAN_V2.md Phase 8 and section 8.1.

Build:
1. src/server/services/mpesa/client.ts: OAuth token cached in Redis;
   initiateSTKPush; password = base64(shortcode + passkey + timestamp) with an
   Africa/Nairobi YYYYMMDDHHmmss timestamp; phone -> 254XXXXXXXXX;
   amount cents -> whole shillings.
2. Insert MpesaTransaction with status INITIATED BEFORE calling Safaricom;
   store checkoutRequestId from the response.
3. /api/mpesa/callback: log raw body to rawCallback FIRST; Redis idempotency
   key idem:mpesa:{checkoutRequestId} as the first gate, the unique column as
   backstop; if already COMPLETED return 200 and stop; on ResultCode 0 create
   the payment and run the Phase 7 allocation engine, or activate the
   subscription, in ONE transaction; ALWAYS return HTTP 200.
4. /api/mpesa/timeout handler.
5. /api/stk-status/[checkoutId] with a Redis-cached status; client polls every
   3s for up to 90s with clear states.
6. Redis rate limit: 3 STK pushes per 5 minutes per phone.
7. Two use cases: manager subscription (signup + settings) and tenant rent
   (/my/pay prefilled with outstanding balance).
8. QStash schedule every 30 min: reconcile transactions stuck INITIATED > 10 min.
9. Manager reconciliation page + platform-portal raw webhook viewer with replay.
10. Keep manual payment entry fully working for cash, bank and offline M-Pesa.

Constraints:
- Sandbox credentials only, all from env vars.
- Write a test that replays the same callback three times and asserts exactly
  one Payment row exists.
- Never log the consumer secret or passkey.
```

---

### PHASE 9 : Operations, Tenant Portal and the Platform (Developer) Portal

**Goal:** Close the loop between tenants, caretakers and managers : and give yourself real operational control over the platform.

**Why now:** Money is handled. Now the day-to-day reality (a leaking tap, a water-rationing notice) and the developer's view of the whole system.

**What you build**

**9a : Maintenance and complaints**
1. Tenant raises a request: category, description, priority, photo (private R2).
2. Manager / Customer Care queue: filter by property, status, priority, age; assign to a caretaker.
3. Caretaker view: only requests on assigned units; update status, comment, attach photos.
4. Status flow `OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`. Only the raising tenant or a manager may **close** : otherwise "resolved" means nothing.
5. Comment thread using Preline **Chat Bubbles**; status history using Preline **Timeline**.

**9b : Announcements**
6. Compose with audience `ALL | PROPERTY:id | UNIT:id`, optional scheduled publish. Audience is stored as a **rule**, resolved to recipients at send time, so a tenant who moves in tomorrow still sees a standing notice.

**9c : Tenant portal, complete**
7. Home (balance hero, next due, Pay rent, latest announcement, open requests), invoices, payments with receipts, maintenance, lease, profile, change password.

**9d : Platform (developer) portal, complete** : see §3.5
8. Organizations (suspend / reactivate), subscriptions + MRR, platform users
9. **Support sessions:** time-boxed, reason-required, fully audited access to an org's data
10. **Jobs & Queues:** QStash schedules, recent runs, failures, DLQ with one-click replay
11. **Webhooks:** raw M-Pesa callbacks with result codes, matched payments and replay
12. **Feature flags:** Redis-backed booleans and percentage rollouts, toggled without a deploy
13. **System health:** database latency, Redis latency, R2 reachability, last successful job, 24h M-Pesa failure rate
14. **Audit logs** (filter + CSV) and **email log** (delivery status)

**9e : Notifications**
15. One fan-out service function per event, publishing a QStash message for the email and writing a `Notification` row: invoice issued, payment received, arrears reminder, maintenance status change, announcement published, invitation received.
16. Bell menu with unread count and mark-as-read.

**Concepts explained simply**

- *Notification fan-out:* one event produces several outputs : a row, an email, a dashboard change. Write it once in a service function and call it from the action. Never scatter `sendEmail` calls through UI code.
- *Audience as a rule, not a list:* storing `PROPERTY:7` instead of a frozen list of 12 tenant IDs means the notice stays correct as tenancies change.
- *Support session:* the honest way to let support see customer data. Time-boxed, reason-required, audited. The alternative : permanent silent access : is what regulators fine companies for.
- *Feature flag:* a switch that separates *deploying* code from *releasing* it. Ship a half-finished report behind a flag, turn it on for yourself only, turn it off instantly if it misbehaves during your defence.
- *Dead-letter queue:* where a message goes after every retry has failed. Without one, failures vanish. With one, Monday morning shows you a list of exactly what needs attention : and a replay button.

**Mistakes to avoid**

- ❌ Letting a caretaker see requests outside their assignment. Same scoping rule as Phase 5, applied again.
- ❌ Letting anyone close a ticket. The person who reported the problem confirms it is fixed.
- ❌ Emailing every tenant on every trivial event. Notification fatigue makes people ignore the important ones. Be selective and allow muting.
- ❌ A platform portal that reads tenant personal data with no audit trail.
- ❌ Building the tenant portal desktop-first. Tenants are on mid-range Android on mobile data. Test throttled.
- ❌ A DLQ nobody looks at. Surface the count on the platform dashboard.

**Definition of Done**
- [ ] Full maintenance lifecycle works across tenant, manager and caretaker
- [ ] Caretaker scoping holds in the maintenance module
- [ ] Announcements reach exactly the intended audience
- [ ] Tenant portal is complete and usable one-handed at 360px on a throttled connection
- [ ] Platform admin can suspend an org and it takes effect immediately
- [ ] A support session is required, time-boxed and audited
- [ ] DLQ replay works; feature flag toggles without a deploy
- [ ] Notifications fire for all six events, in-app and by email

**Claude Code prompt**

```
Phase 9 only : Operations, Tenant Portal, Platform Portal.

Read docs/SILQU_BUILD_PLAN_V2.md sections 3.5, 6, 7 and 8.

Build:
1. Maintenance: tenant raise (category, description, priority, private photo);
   manager/customer-care queue with assignment; caretaker view scoped to
   assigned units; OPEN->ASSIGNED->IN_PROGRESS->RESOLVED->CLOSED where only
   the raising tenant or a manager may CLOSE; comments via Preline Chat
   Bubbles; status history via Preline Timeline.
2. Announcements with audience stored as a RULE (ALL | PROPERTY:id | UNIT:id)
   resolved to recipients at send time; optional scheduled publish via QStash.
3. Complete tenant portal: home (balance hero, next due, pay rent, latest
   announcement, open requests), invoices, payments, maintenance, lease,
   profile.
4. Platform portal per section 3.5: organizations (suspend/reactivate),
   subscriptions + MRR, users, time-boxed audited support sessions,
   Jobs & Queues (QStash schedules, failures, DLQ + replay), Webhooks
   (raw M-Pesa callbacks + replay), Feature flags (Redis), System health,
   Audit logs (filter + CSV), Email log.
5. Notification fan-out service: one function per event writing a Notification
   row and publishing a QStash email job. Six events listed in Phase 9e.
6. Bell menu with unread count and mark-as-read.

Constraints:
- Caretaker maintenance scope enforced in the query layer.
- Every platform read of tenant personal data writes an AuditLog row.
- Tenant portal verified one-handed at 360px on a throttled connection.
- Feature flags must change behaviour without a redeploy.
```

---

### PHASE 10 : Reporting, Go Service, Testing, Hardening, Deployment

**Goal:** Turn a working application into a defensible, deployed, documented product.

**Why now:** Everything exists. Prove it works, prove it is safe, ship it.

**What you build**

**10a : Reporting and the Go microservice**
1. Reports: monthly collection summary, arrears ageing, occupancy trend, property performance comparison, tenant statement. Each with a date range, property filter, ApexCharts chart + table, CSV and PDF export.
2. **Go microservice** (`services/reports-go`): one small HTTP service computing the heavy aggregations : portfolio-wide collection rate, multi-month occupancy trend, arrears ageing across all properties : using **goroutines for concurrent per-property queries**.
   - Shared-secret header auth between Next.js and Go
   - `/healthz` endpoint, Dockerfile, deployed to Fly.io or Render
   - Next.js calls it and **falls back to a slower SQL path** if it is unreachable
   - Keep it genuinely small and genuinely real : that is what makes the "Go microservice" claim in your proposal defensible rather than decorative

**10b : Testing**
3. Unit (Vitest): money helpers, allocation engine, permission matrix, invoice idempotency, job idempotency, period maths, phone normalisation, Redis lock behaviour.
4. Integration: server actions against a Neon **test branch**.
5. E2E (Playwright): auth, property CRUD, tenant onboarding, invoice + payment, caretaker scope, **portal isolation**.
6. Map all 25 Test Plan cases to an automated or documented manual test, and produce a results table for your final report.
7. UAT with 3–5 real landlords: scripted tasks, observation notes, a short questionnaire, and a table of changes made in response.

**10c : Security hardening**
8. Checklist:
   - [ ] Every server action begins with a permission check
   - [ ] Every query is org-scoped
   - [ ] All input validated with Zod server-side
   - [ ] Rate limits on login, invitations, password reset, STK Push
   - [ ] `/api/jobs/*` signature-verified; `/api/mpesa/callback` idempotent
   - [ ] Security headers: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`
   - [ ] No secrets in the client bundle (`npm run build`, then grep the output)
   - [ ] `npm audit` clean of high and critical
   - [ ] No `dangerouslySetInnerHTML` on user content
   - [ ] Private R2 objects unreachable without a signed URL
   - [ ] Uploads validated for type and size server-side
   - [ ] Errors shown to users leak no stack traces
   - [ ] Platform portal enforces TOTP and idle timeout
   - [ ] Audit log covers every sensitive action
9. **Data Protection Act, 2019 write-up:** lawful basis, purpose limitation, data minimisation, retention, subject access (a tenant can export their own data), breach procedure : and a note that Redis holds no personal data.

**10d : Performance**
10. `EXPLAIN ANALYZE` on the slowest list queries; add missing indexes.
11. Pagination everywhere. Never fetch an unbounded table.
12. `next/image` for all images; fonts subset and preloaded.
13. Lighthouse ≥ 90 on performance and accessibility for the main dashboards and the tenant portal.

**10e : Deployment and documentation**
14. Vercel production: env vars set, Neon `main` connected, three subdomains configured, QStash schedules pointing at production URLs.
15. Go service deployed with health checks.
16. `README.md`: setup, env vars, scripts, architecture diagram, deployment steps.
17. Update your SRS, SDS, Test Plan and User Manual to match what was **actually built**. Where the build diverged from the design, **document the divergence and the reason** : examiners reward honest, reasoned change far more than a pretend-perfect plan.
18. Demo script: a 10-minute walkthrough with prepared data, rehearsed. Record a backup video in case the Wi-Fi fails.

**Concepts explained simply**

- *Unit vs integration vs E2E:* a unit test checks one function (does `allocatePayment` split KES 16,000 correctly?). An integration test checks two parts talking. An E2E test drives a real browser through a real journey. You need all three, and most of the first.
- *`EXPLAIN ANALYZE`:* Postgres tells you how it ran your query. "Seq Scan" on a big table means a missing index.
- *CSP:* a list telling the browser which script sources are allowed. It turns many XSS bugs from a breach into a blocked console error.
- *Why the Go service stays small:* an academic project is judged on whether the choice is justified and working, not on volume. One well-argued concurrent aggregation service beats a sprawling half-finished one.

**Mistakes to avoid**

- ❌ Leaving testing until the last week. Write tests alongside each phase; Phase 10 fills gaps, it does not start.
- ❌ Deploying for the first time the night before the defence.
- ❌ Demoing on an empty database.
- ❌ Claiming features you did not build. Examiners open the code.
- ❌ Documentation describing the plan rather than the product.
- ❌ No offline backup. Record the demo. Take screenshots. Assume the internet will fail.

**Definition of Done**
- [ ] All reports work with CSV and PDF export
- [ ] Go service deployed, called, and gracefully falling back
- [ ] All 25 Test Plan cases executed with results recorded
- [ ] E2E suite green in CI
- [ ] Security checklist fully ticked
- [ ] Lighthouse ≥ 90 performance and accessibility
- [ ] Three subdomains live in production with QStash schedules firing
- [ ] README, SRS, SDS, Test Plan and User Manual updated to match the build
- [ ] Demo rehearsed and recorded

**Claude Code prompt**

```
Phase 10 only : Reporting, Go service, testing, hardening, deployment.

Read docs/SILQU_BUILD_PLAN_V2.md Phase 10.

Build:
1. Reports: monthly collection summary, arrears ageing, occupancy trend,
   property performance comparison, tenant statement. Each with date range,
   property filter, ApexCharts chart + table, CSV and PDF export.
2. services/reports-go: small Go HTTP service computing portfolio collection
   rate, multi-month occupancy trend and arrears ageing using goroutines for
   concurrent per-property queries. Shared-secret header auth, /healthz,
   Dockerfile. Next.js calls it with a SQL fallback if unreachable.
3. Vitest: money, allocate-payment, permissions, invoice idempotency,
   job idempotency, period maths, phone normalisation, Redis lock.
4. Playwright: auth, property-crud, tenant-onboarding, invoice-payment,
   caretaker-scope, portal-isolation.
5. GitHub Actions: typecheck, lint, verify:icons, unit tests, build,
   Playwright on PRs.
6. Security: rate limits, CSP + HSTS + X-Frame-Options +
   X-Content-Type-Options via next.config headers, server-side upload
   validation, error boundaries that leak no stack traces.
7. Pagination on every list; EXPLAIN ANALYZE the slow queries and add indexes.
8. README with setup, env vars, scripts, architecture diagram, deploy steps.

Constraints:
- Do not add new features in this phase.
- Every test maps to a numbered case in the Test Plan document.
- Produce a table mapping all 25 Test Plan cases to automated tests.
```

---

## 10. ENVIRONMENT VARIABLES

```bash
# ---- Core ----
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BUSINESS_HOST=app.silqu.co.ke
NEXT_PUBLIC_TENANT_HOST=my.silqu.co.ke
NEXT_PUBLIC_PLATFORM_HOST=platform.silqu.co.ke

# ---- Database (Neon) ----
DATABASE_URL=                      # POOLED  : used by the app
DATABASE_URL_UNPOOLED=             # DIRECT  : used by Prisma migrations

# ---- Auth ----
AUTH_SECRET=                       # openssl rand -base64 32
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
TOTP_ENCRYPTION_KEY=               # Encrypts platform TOTP secrets at rest
PLATFORM_EMAIL_ALLOWLIST=          # Comma-separated

# ---- Upstash Redis ----
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ---- Upstash QStash ----
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
QSTASH_TARGET_BASE_URL=            # Public base URL QStash calls (ngrok in dev)

# ---- Cloudflare R2 ----
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PUBLIC=silqu-public
R2_BUCKET_PRIVATE=silqu-private
R2_PUBLIC_BASE_URL=
R2_ENDPOINT=

# ---- Email (Resend) ----
RESEND_API_KEY=
EMAIL_FROM="SILQU <noreply@silqu.co.ke>"

# ---- M-Pesa Daraja (sandbox) ----
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://<ngrok-id>.ngrok-free.app/api/mpesa/callback
MPESA_TIMEOUT_URL=https://<ngrok-id>.ngrok-free.app/api/mpesa/timeout

# ---- Go reports service ----
REPORTS_SERVICE_URL=http://localhost:8080
REPORTS_SERVICE_SECRET=

# ---- Plans (whole KES) ----
PLAN_MONTHLY_PRICE=2500
PLAN_ANNUAL_PRICE=25000
PLAN_MONTHLY_UNIT_LIMIT=50
```

**Rules**
- Only `NEXT_PUBLIC_` variables reach the browser. **Never prefix a secret.**
- `.env.local` is in `.gitignore` from commit #1.
- If a secret is ever committed, **rotate it** : removing it in a later commit does not remove it from history.
- On Vercel, set every variable separately for Production, Preview and Development.
- `QSTASH_TARGET_BASE_URL` changes every time ngrok restarts. Re-run `scripts/qstash-schedules.mjs` when it does.

---

## 11. MISTAKES LEDGER

### 11.1 What you have already done right : keep doing it

| Decision | Why it is strong |
|---|---|
| **Documentation before code** (SRS, SDS, Test Plan, Implementation Plan, User Manual) | You are building from requirements, not vibes. Most students write documentation backwards and it shows. |
| **Six roles with genuinely distinct scopes** | Real RBAC, not a token admin/user split. Demonstrable in a viva. |
| **Caretaker scope framed as data access, not menu hiding** | The difference between having *heard of* RBAC and *understanding* it. |
| **Temp password over magic link, with written justification** | You made a trade-off and recorded the reasoning. Examiners reward reasoned trade-offs far above recited best practice. |
| **Three separate portals** | An architecture decision with four independent justifications (§3.2). This is the strongest single point in your design. |
| **Traceability : every feature maps to an SRS requirement** | Exactly how requirements engineering is assessed. Keep the mapping current. |
| **Hashed invitation tokens, bcrypt, TLS, forced first-login change** | Security thinking beyond the syllabus minimum. |
| **Owning your own auth after leaving Supabase** | Harder, but you can now explain every line of the flow. Strictly better under questioning. |
| **Moving from cron to a real queue** | Shows you understand that billing failures must be recoverable, not merely logged. |
| **Choosing a component library and sticking to it** | Consistency is a marking criterion. Preline plus a documented token swap beats hand-rolling 60 components badly. |

### 11.2 Mistakes to watch for, by stage

| Stage | Mistake | Cost | Fix |
|---|---|---|---|
| Planning | Features not traceable to the SRS | Scope creep, unmarked work | Every PR names its requirement ID |
| Design system | `@theme inline` | Portal theming silently dies | Plain `@theme` |
| Design system | Pasting Preline's `blue-600` / `gray-500` | UI drifts within a week | §7.2 token swap, enforced in CI |
| Preline | No re-init on route change | Dropdowns and modals break on page 2 | `usePathname()` dependency |
| Preline | Reaching for Preline Datatables | Drags jQuery in; cannot server-paginate | TanStack logic + Preline markup |
| Icons | Guessed Solar names | Blank squares in your demo | `verify-icons.mjs` in CI |
| Database | `Float`, `Decimal` or `BigInt` per row | Wrong balances, or a serialisation crash | `Int` cents (§5.3) |
| Database | Missing `orgId` | Cross-organization data leak : a DPA breach | `orgId` everywhere + query-layer enforcement |
| Prisma | New client per request | Neon refuses connections in 20 minutes | Global singleton |
| Prisma | Pooled/direct URLs swapped | Confusing migration failures | Comment them in the schema |
| Prisma | Default 5s transaction timeout on bulk work | Half-generated invoice runs | Explicit `{ maxWait, timeout }` |
| Auth | UI-only permission checks | Total bypass by typing a URL | Server guard first |
| Auth | One cookie for three portals | Defeats the entire portal design | Three cookie names |
| Auth | Revealing which credential was wrong | Account enumeration | One generic message |
| CRUD | Skipping server-side validation | Corrupt data, injection surface | Same Zod schema both sides |
| CRUD | Hard deletes on financial records | Broken audit trail | Archive |
| Storage | ID scans in the public bucket | **DPA breach** | Private bucket + signed reads + audit |
| Billing | Non-idempotent invoice generation | Double billing | Unique constraint + Redis lock |
| Billing | Allocation outside a transaction | Books stop balancing | One transaction, always |
| Queue | Unsigned `/api/jobs/*` | Public "bill everyone" button | `verifySignatureAppRouter` |
| Queue | All orgs in one handler | Timeout, partial billing | Fan out |
| Queue | Nobody watches the DLQ | Silent failures | Surface the count on the platform dashboard |
| M-Pesa | Trusting the STK response | Recording unpaid rent as paid | Only the callback confirms |
| M-Pesa | No duplicate-callback handling | Triple-recorded payments | Redis key + unique column |
| M-Pesa | Wrong timezone in the password | Cryptic auth failures | `Africa/Nairobi`, always |
| Redis | Treating it as a source of truth | Data loss on eviction | Cache and counters only |
| Redis | Storing personal data | Harder to audit than Postgres | Hashed identifiers only |
| Ops | Notifying on everything | Users ignore notifications | Be selective, allow muting |
| Testing | Testing at the end | No time, no coverage, no marks | Test per phase |
| Deployment | First deploy the night before | Catastrophe | Deploy in Phase 1 |
| Demo | Empty database | Nothing to show | Seed and rehearse |
| Docs | Describing the plan, not the build | Examiner finds the gap | Update at the end of every phase |

### 11.3 Four questions before every commit

1. **Why** does this exist : which SRS requirement does it serve?
2. **How** is it protected : which permission check and which validation guard it?
3. **What** breaks if it runs twice, or halfway?
4. **Who** can see this data, and is that scope enforced on the server?

If you cannot answer all four, the code is not ready.

---

## 12. `CLAUDE.md` : PUT THIS AT YOUR REPOSITORY ROOT

Claude Code reads this automatically at the start of every session. Copy it verbatim.

```markdown
# SILQU : Working Agreement

## Project
SILQU is a web-based rental property management system for small and medium
landlords and property managers in Kenya. Final Year Project II, KCA University.

## Read first
- docs/SILQU_BUILD_PLAN_V2.md  ← the authoritative build plan
- docs/SRS.pdf, docs/SDS.pdf, docs/TEST_PLAN.pdf

## Stack
Next.js 14 App Router · TypeScript strict · Tailwind CSS v4 (CSS-first @theme) ·
Preline UI v4.2 · Iconify + Solar icon set · Neon Postgres · Prisma (Neon
driver adapter) · Auth.js v5 · Zod · react-hook-form · TanStack Table ·
ApexCharts · Upstash Redis · Upstash QStash · Cloudflare R2 · Resend ·
Safaricom Daraja (sandbox) · Go reports microservice · Vercel

## Three portals
1. Business  : app.silqu.co.ke      : MANAGER, EMPLOYEE, CARETAKER
2. Tenant    : my.silqu.co.ke       : TENANT
3. Platform  : platform.silqu.co.ke : PLATFORM_ADMIN, PLATFORM_SUPPORT
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
   token swap in section 7.2 : no stock Tailwind palette classes.
8. Icons come only from the ICONS registry in src/lib/icons.ts. Never write a
   raw "solar:..." string in a component. Run npm run verify:icons after edits.
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
```

---

## 13. SCHEDULE AND QUICK REFERENCE

### 13.1 Suggested schedule (15–20 focused hours per week)

| Week | Phase | Milestone |
|---|---|---|
| 1 | 1 | Design system live on Vercel; Preline surviving route changes |
| 2 | 2 | Prisma schema migrated, seeded, ERD exported |
| 3 | 3 | Six roles, three doors, portal isolation tested |
| 4 | 4 | Three shells with real dashboard data : **screenshot for progress report** |
| 5 | 5 | Properties, units, R2 uploads, caretaker scope proven |
| 6 | 6 | Tenant onboarding end to end |
| 7–8 | 7 | Billing engine + QStash fan-out with tests |
| 9 | 8 | M-Pesa sandbox working, duplicate callbacks proven safe |
| 10 | 9 | Maintenance, announcements, tenant portal, platform portal |
| 11 | 10a–b | Reports, Go service, full test suite |
| 12 | 10c–e | Hardening, deployment, documentation, demo rehearsal |

**Buffer rule:** whatever you estimate, add 40%. M-Pesa in particular will take longer than you think : everyone who has integrated Daraja says the same thing.

### 13.2 Commands

```bash
pnpm dev                  # Development server
pnpm build                # Production build : run before every push
pnpm verify:icons         # Validate the Solar icon registry
pnpm dlx prisma migrate dev       # Create + apply a migration
pnpm dlx prisma migrate deploy    # Apply migrations in production
pnpm dlx prisma studio            # Browse the database visually
pnpm db:seed              # Seed sample data
pnpm test                 # Vitest
pnpm test:e2e             # Playwright
node scripts/qstash-schedules.mjs   # Create / update QStash schedules
pnpm dlx ngrok http 3000          # Public URL for M-Pesa and QStash callbacks
```

### 13.3 Phase gates : do not proceed until true

| Phase | Gate |
|---|---|
| 1 | `/design-system` renders in all three themes; a Preline dropdown still works after client-side navigation; `verify:icons` passes |
| 2 | Every model exists; the partial index and CHECK constraints provably reject bad data |
| 3 | Six roles land correctly; a copied cookie fails across portals; direct-URL bypass returns 403 |
| 4 | All dashboards show real seeded numbers; KPI cache busts on write |
| 5 | Caretaker scope proven by an automated test; private/public bucket split working |
| 6 | Invite → accept → tenant login works on the live URL |
| 7 | Allocation passes every edge case; a failed job reaches the DLQ and replays |
| 8 | A replayed callback creates exactly one payment |
| 9 | Full maintenance lifecycle across three roles; support session audited |
| 10 | All 25 Test Plan cases executed and recorded |

### 13.4 The three things to say in your viva

If you only get three sentences to explain your architecture, use these:

1. *"SILQU is three isolated portals over one database, because the landlord's staff, the landlord's customers, and the software vendor have three different relationships to the data : and each has its own session, theme and permission set."*
2. *"All money is stored as integer cents, and every write that touches money happens inside a single database transaction, so the books cannot be left half-updated."*
3. *"Anything that can fail and must not be lost : invoice generation, receipts, M-Pesa reconciliation : runs on a queue with retries and a dead-letter queue, so a failure is visible and replayable rather than silent."*

---

*End of build plan v2.0. Keep this document updated as the build diverges : a plan that no longer matches the product is worse than no plan at all.*

---

## APPENDIX : Package manager note

This project uses **pnpm**, not npm. Wherever this document says `npm i` / `npm run` in a code block, run the pnpm equivalent instead: `pnpm add` for installs, `pnpm <script>` for package.json scripts, and `pnpm dlx <pkg>` in place of `npx <pkg>`. CLAUDE.md's working agreement enforces this project-wide.
