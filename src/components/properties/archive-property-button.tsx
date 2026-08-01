"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalTrigger } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { closeOverlay } from "@/components/ui/drawer";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { archivePropertyAction } from "@/server/actions/property.actions";

export function ArchivePropertyButton({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { push } = useToast();
  const id = `archive-property-confirm-${propertyId}`;

  return (
    <>
      <ModalTrigger targetId={id} className={buttonClass("danger")}>
        Archive property
      </ModalTrigger>
      <ConfirmModal
        id={id}
        title="Archive property"
        message="Archive this property? It will be hidden from active listings."
        confirmLabel="Archive property"
        danger
        pending={isPending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await archivePropertyAction(propertyId);
            if (result?.error) {
              setError(result.error);
              push(result.error, "danger");
              return;
            }
            push("Property archived.", "success");
            closeOverlay(id);
            router.refresh();
          })
        }
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </>
  );
}
