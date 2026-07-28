"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { setPropertyPhotoAction } from "@/server/actions/property.actions";

export function PhotoUpload({ propertyId, photoUrl }: { propertyId: string; photoUrl: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setProgress(true);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, contentType: file.type, size: file.size }),
      });
      const signed = await signRes.json();
      if (!signRes.ok) throw new Error(signed.error ?? "Upload failed.");

      const putRes = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      startTransition(async () => {
        await setPropertyPhotoAction(propertyId, signed.key);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="Property" className="h-40 w-full rounded-[--radius-card] object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-[--radius-card] border border-dashed border-line bg-canvas text-ink-muted">
          <Icon name="emptyBuilding" size={32} />
        </div>
      )}
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-[--radius-control] border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-canvas">
        <Icon name="export" size={16} />
        {progress || isPending ? "Uploading…" : "Change photo"}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} disabled={progress || isPending} />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
