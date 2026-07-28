import { EmptyState } from "@/components/ui/empty-state";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-6">
      <EmptyState icon="lock" title="Access denied" description="You don't have permission to view this page." />
    </div>
  );
}
