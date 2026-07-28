"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { confirmTenantDocumentAction } from "@/server/actions/tenant.actions";

export function DocumentUpload({ tenantId }: { tenantId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch("/api/documents/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, contentType: file.type, size: file.size }),
      });
      const signed = await signRes.json();
      if (!signRes.ok) throw new Error(signed.error ?? "Upload failed.");

      const putRes = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      startTransition(async () => {
        await confirmTenantDocumentAction(tenantId, signed.key);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-[--radius-control] border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-canvas">
        <Icon name="export" size={16} />
        {uploading || isPending ? "Uploading…" : "Upload ID scan"}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={onChange} disabled={uploading || isPending} />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
