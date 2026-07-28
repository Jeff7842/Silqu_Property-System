"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { archivePropertyAction } from "@/server/actions/property.actions";

export function ArchivePropertyButton({ propertyId }: { propertyId: string }) {
  const [state, formAction, pending] = useActionState(archivePropertyAction.bind(null, propertyId), undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Archive this property? It will be hidden from active listings.")) e.preventDefault();
      }}
    >
      <Button type="submit" variant="danger" loading={pending}>
        Archive property
      </Button>
      {state?.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </form>
  );
}
