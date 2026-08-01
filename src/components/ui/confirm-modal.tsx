"use client";

import { Modal, ModalTrigger } from "@/components/ui/modal";
import { Button, buttonClass } from "@/components/ui/button";

/** Replaces window.confirm() : a Preline modal with a Cancel + Confirm/Danger action, closed by ModalTrigger's data-hs-overlay toggle. */
export function ConfirmModal({
  id,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  pending = false,
}: {
  id: string;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <Modal
      id={id}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <ModalTrigger targetId={id} className={buttonClass("secondary")}>
            Cancel
          </ModalTrigger>
          <Button variant={danger ? "danger" : "primary"} loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ink-muted">{message}</p>
    </Modal>
  );
}
