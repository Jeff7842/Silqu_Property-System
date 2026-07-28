import { type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { IconName } from "@/lib/icons";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyIcon = "emptyFolder",
  emptyTitle = "Nothing here yet",
  emptyDescription,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyIcon?: IconName;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 ${col.align === "right" ? "text-right" : "text-left"}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line last:border-0 hover:bg-canvas">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-3 align-middle ${col.align === "right" ? "text-right" : "text-left"} ${col.className ?? ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
