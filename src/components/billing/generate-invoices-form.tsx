"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { generateInvoicesAction } from "@/server/actions/billing.actions";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Preview = { count: number; totalCents: number; byProperty: { propertyName: string; count: number; totalCents: number }[] };

export function GenerateInvoicesForm() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, startPreview] = useTransition();
  const [state, formAction, pending] = useActionState(generateInvoicesAction, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setPreview(null);
      router.refresh();
    }
  }, [state?.success, router]);

  function loadPreview() {
    startPreview(async () => {
      const res = await fetch(`/api/invoices/preview?year=${year}&month=${month}`);
      setPreview(await res.json());
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select label="Month" value={month} onChange={(e) => { setMonth(Number(e.target.value)); setPreview(null); }}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </Select>
        <Select label="Year" value={year} onChange={(e) => { setYear(Number(e.target.value)); setPreview(null); }}>
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Button type="button" variant="secondary" loading={previewing} onClick={loadPreview}>Preview</Button>
      </div>

      {preview && (
        <div className="rounded-[--radius-control] border border-line bg-canvas p-4">
          <p className="text-sm text-ink">
            <span className="font-semibold">{preview.count}</span> invoice{preview.count === 1 ? "" : "s"} will be created, totalling{" "}
            <Money cents={preview.totalCents} size="small" />.
          </p>
          {preview.byProperty.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-muted">
              {preview.byProperty.map((p) => (
                <li key={p.propertyName}>{p.propertyName}: {p.count} unit{p.count === 1 ? "" : "s"} : <Money cents={p.totalCents} size="small" showCurrency={false} /></li>
              ))}
            </ul>
          )}
          {preview.count > 0 && (
            <form action={formAction} className="mt-3">
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="month" value={month} />
              <Button type="submit" loading={pending}>Confirm and generate</Button>
            </form>
          )}
        </div>
      )}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </div>
  );
}
