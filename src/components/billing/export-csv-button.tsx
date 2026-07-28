"use client";

import Papa from "papaparse";
import { Button } from "@/components/ui/button";

export function ExportCsvButton<T extends Record<string, unknown>>({ rows, filename }: { rows: T[]; filename: string }) {
  function download() {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return <Button type="button" variant="secondary" onClick={download}>Export CSV</Button>;
}
