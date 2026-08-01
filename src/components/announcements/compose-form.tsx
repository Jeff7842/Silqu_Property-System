"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { publishAnnouncementAction } from "@/server/actions/announcement.actions";

type PropertyOption = { id: string; name: string; units: { id: string; label: string }[] };

export function ComposeForm({ properties, onSuccess }: { properties: PropertyOption[]; onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(publishAnnouncementAction, undefined);
  const [audience, setAudience] = useState<"ALL" | "PROPERTY" | "UNIT">("ALL");
  const [propertyId, setPropertyId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setAudience("ALL");
      setPropertyId("");
      onSuccess?.();
    }
  }, [state?.success, onSuccess]);

  const units = properties.find((p) => p.id === propertyId)?.units ?? [];

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <Input name="title" label="Title" required />
      <Textarea name="body" label="Message" rows={3} required />
      <div className="grid grid-cols-3 gap-4">
        <Select name="audience" label="Audience" value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} required>
          <option value="ALL">All tenants</option>
          <option value="PROPERTY">One property</option>
          <option value="UNIT">One unit</option>
        </Select>
        {audience !== "ALL" && (
          <Select name="propertyId" label="Property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
            <option value="">Choose a property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        )}
        {audience === "UNIT" && (
          <Select name="unitId" label="Unit" required disabled={!propertyId}>
            <option value="">Choose a unit</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </Select>
        )}
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Announcement published.</p>}
      <Button type="submit" loading={pending} className="self-start">Publish</Button>
    </form>
  );
}
