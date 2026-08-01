import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { auth } from "@/server/auth/platform";
import { requireRole } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { redis } from "@/server/services/redis/client";
import { r2, R2_BUCKET_PRIVATE } from "@/server/services/r2/client";
import { getMpesaFailureRate24h } from "@/server/db/queries/mpesa";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PingResult = { ms: number; ok: boolean; error?: string };

async function timed(fn: () => Promise<unknown>): Promise<PingResult> {
  const start = performance.now();
  try {
    await fn();
    return { ms: Math.round(performance.now() - start), ok: true };
  } catch (err) {
    return { ms: Math.round(performance.now() - start), ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function HealthPage() {
  const session = await auth();
  requireRole(session, ["PLATFORM_ADMIN", "PLATFORM_SUPPORT"]);

  // Narrowed to locals before the closures below : `redis`/`r2` are typed as
  // possibly-undefined module exports, and TS doesn't carry the ternary's
  // narrowing into a callback that runs later.
  const redisClient = redis;
  const r2Client = r2;

  const [dbPing, redisPing, r2Ping, lastInvoice, mpesaHealth] = await Promise.all([
    timed(() => db.$queryRaw`SELECT 1`),
    redisClient ? timed(() => redisClient.ping()) : Promise.resolve(null),
    r2Client ? timed(() => r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_PRIVATE }))) : Promise.resolve(null),
    db.invoice.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    getMpesaFailureRate24h(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="System health" description="Live round-trip checks against every dependency SILQU relies on." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ServiceStatusCard label="Database (Neon Postgres)" result={dbPing} />
        <ServiceStatusCard label="Redis (Upstash)" result={redisPing} notConfiguredHint="UPSTASH_REDIS_REST_URL / TOKEN not set" />
        <ServiceStatusCard label="R2 (Cloudflare)" result={r2Ping} notConfiguredHint="R2_ACCOUNT_ID / keys not set" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card header={<h3 className="font-semibold text-ink">Last invoice generation run</h3>}>
          {/* Proxy for "last successful job run": there's no dedicated job-run
              log table, and the monthly generate-invoices job is the only
              recurring job whose output (an Invoice row) is reliably dated. */}
          <p className="text-sm text-ink">
            {lastInvoice
              ? new Date(lastInvoice.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
              : "No invoices generated yet"}
          </p>
        </Card>
        <Card header={<h3 className="font-semibold text-ink">M-Pesa failure rate (24h)</h3>}>
          <p className="text-2xl font-semibold text-ink">{mpesaHealth.failureRatePercent}%</p>
          <p className="text-xs text-ink-muted">
            {mpesaHealth.failed} failed / {mpesaHealth.total} total
          </p>
        </Card>
      </div>
    </div>
  );
}

function ServiceStatusCard({
  label,
  result,
  notConfiguredHint,
}: {
  label: string;
  result: PingResult | null;
  notConfiguredHint?: string;
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-ink">{label}</p>
      {result === null ? (
        <>
          <Badge tone="neutral">Not configured</Badge>
          {notConfiguredHint && <p className="mt-1 text-xs text-ink-muted">{notConfiguredHint}</p>}
        </>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <Badge tone={result.ok ? "success" : "danger"}>{result.ok ? "Healthy" : "Down"}</Badge>
          <span className="text-xs text-ink-muted">{result.ms}ms</span>
        </div>
      )}
      {result?.error && <p className="mt-1 text-xs text-danger">{result.error}</p>}
    </Card>
  );
}
