"use client";

import { useState } from "react";
import { Drawer, DrawerTrigger, closeOverlay } from "@/components/ui/drawer";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { UnitForm } from "@/components/properties/unit-form";
import { BulkUnitForm } from "@/components/properties/bulk-unit-form";

export function AddUnitDrawer({ propertyId }: { propertyId: string }) {
  const { push } = useToast();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const id = `add-unit-drawer-${propertyId}`;

  return (
    <>
      <DrawerTrigger targetId={id} className={buttonClass()}>
        Add units
      </DrawerTrigger>
      <Drawer id={id} title="Add units">
        <div className="mb-4 flex gap-2">
          {(["single", "bulk"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-[--radius-control] border px-3 py-2 text-sm font-semibold ${
                mode === m ? "border-primary bg-primary/5 text-primary" : "border-line text-ink-muted"
              }`}
            >
              {m === "single" ? "Single unit" : "Bulk create"}
            </button>
          ))}
        </div>
        {mode === "single" ? (
          <UnitForm
            propertyId={propertyId}
            onSuccess={() => {
              push("Unit added.", "success");
              closeOverlay(id);
            }}
          />
        ) : (
          <BulkUnitForm
            propertyId={propertyId}
            onSuccess={() => {
              push("Units created.", "success");
              closeOverlay(id);
            }}
          />
        )}
      </Drawer>
    </>
  );
}
