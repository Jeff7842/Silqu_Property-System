// Creates the recurring QStash schedules for Phase 7/8/9 jobs. Re-run this
// whenever QSTASH_TARGET_BASE_URL changes (e.g. a new ngrok URL in dev).
import { Client } from "@upstash/qstash";

const token = process.env.QSTASH_TOKEN;
const baseUrl = process.env.QSTASH_TARGET_BASE_URL;

if (!token || !baseUrl) {
  console.error("QSTASH_TOKEN and QSTASH_TARGET_BASE_URL must be set.");
  process.exit(1);
}

const client = new Client({ token });

// ponytail: only the job Phase 7 actually built is scheduled here. The build
// plan's other three (arrears reminders, lease expiry, subscription renewals)
// depend on features not built yet (email, lease-expiry checks, subscriptions
// billing) — add them here once their /api/jobs/* routes exist.
const schedules = [
  { path: "/api/jobs/generate-invoices", cron: "0 6 1 * *", label: "Monthly invoice generation (1st, 06:00)" },
  { path: "/api/jobs/reconcile-mpesa", cron: "*/30 * * * *", label: "M-Pesa reconciliation sweep (every 30 min)" },
];

for (const s of schedules) {
  const res = await client.schedules.create({ destination: `${baseUrl}${s.path}`, cron: s.cron });
  console.log(`✓ ${s.label} -> ${res.scheduleId}`);
}
