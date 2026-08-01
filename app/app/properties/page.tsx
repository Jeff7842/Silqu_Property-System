import Link from "next/link";
import { auth } from "@/server/auth/business";
import { requireOrg, requireRole } from "@/server/auth/session";
import { listProperties, listPropertiesForCaretaker } from "@/server/db/queries/properties";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import { AddPropertyDrawer, AddPropertyTrigger } from "@/components/properties/property-drawer";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; county?: string; status?: string }>;
}) {
  const session = await auth();
  const user = requireRole(session, ["MANAGER", "EMPLOYEE", "CARETAKER"]);
  const orgId = requireOrg(session);
  const { q, county, status } = await searchParams;

  const properties =
    user.role === "CARETAKER"
      ? await listPropertiesForCaretaker(orgId, user.id)
      : await listProperties(orgId, {
          search: q,
          county: county || undefined,
          status: status === "ARCHIVED" ? "ARCHIVED" : status === "ACTIVE" ? "ACTIVE" : undefined,
        });

  const canManage = user.role === "MANAGER" || (user.role === "EMPLOYEE" && user.subRole === "OWNER_MANAGER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Properties"
        description="Every building in your portfolio."
        actions={canManage && <AddPropertyDrawer />}
      />

      {user.role !== "CARETAKER" && (
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
          <div className="flex-1">
            <Input name="q" placeholder="Search by name or town" defaultValue={q} icon="search" />
          </div>
          <Select name="county" defaultValue={county ?? ""} className="sm:w-48">
            <option value="">All counties</option>
            {KENYA_COUNTIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select name="status" defaultValue={status ?? ""} className="sm:w-40">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      )}

      {properties.length === 0 ? (
        <Card>
          <EmptyState
            icon="emptyBuilding"
            title="No properties yet"
            description={canManage ? "Add your first property to start tracking units and tenants." : "No properties are assigned to you yet."}
            action={canManage && <AddPropertyTrigger />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const occupied = p.units.length;
            const total = p._count.units;
            const rate = total ? Math.round((occupied / total) * 100) : 0;
            return (
              <Link key={p.id} href={`/app/properties/${p.id}`}>
                <Card className="h-full transition-shadow hover:shadow-[--shadow-float]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-ink">{p.name}</h3>
                      <p className="text-sm text-ink-muted">{p.town}, {p.county}</p>
                    </div>
                    {p.status === "ARCHIVED" && <Badge tone="neutral">Archived</Badge>}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{occupied}/{total} units occupied</span>
                    <span className="font-semibold text-ink">{rate}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
