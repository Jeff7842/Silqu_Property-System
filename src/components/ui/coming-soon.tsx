import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import type { IconName } from "@/lib/icons";

export function ComingSoon({ title, icon, phase }: { title: string; icon: IconName; phase: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} />
      <Card>
        <EmptyState icon={icon} title="Coming soon" description={`${title} is being built in ${phase}.`} />
      </Card>
    </div>
  );
}
