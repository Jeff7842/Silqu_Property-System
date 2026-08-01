"use client";

import { Drawer, DrawerTrigger, closeOverlay } from "@/components/ui/drawer";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PropertyForm } from "@/components/properties/property-form";
import { createPropertyAction, updatePropertyAction } from "@/server/actions/property.actions";

export function AddPropertyDrawer() {
  const { push } = useToast();
  return (
    <>
      <DrawerTrigger targetId="add-property-drawer" className={buttonClass()}>
        Add property
      </DrawerTrigger>
      <Drawer id="add-property-drawer" title="Add property">
        <PropertyForm
          action={createPropertyAction}
          submitLabel="Create property"
          onSuccess={() => {
            push("Property created.", "success");
            closeOverlay("add-property-drawer");
          }}
        />
      </Drawer>
    </>
  );
}

/** Second trigger for the same drawer (e.g. an empty-state CTA) : never render a second <AddPropertyDrawer/>, its id isn't unique. */
export function AddPropertyTrigger() {
  return (
    <DrawerTrigger targetId="add-property-drawer" className={buttonClass()}>
      Add property
    </DrawerTrigger>
  );
}

export function EditPropertyDrawer({
  propertyId,
  defaults,
}: {
  propertyId: string;
  defaults: { name: string; county: string; town: string; address: string; type: string };
}) {
  const { push } = useToast();
  const id = `edit-property-drawer-${propertyId}`;
  return (
    <>
      <DrawerTrigger targetId={id} className={buttonClass("secondary")}>
        Edit
      </DrawerTrigger>
      <Drawer id={id} title="Edit property">
        <PropertyForm
          action={updatePropertyAction.bind(null, propertyId)}
          defaults={defaults}
          submitLabel="Save changes"
          onSuccess={() => {
            push("Property updated.", "success");
            closeOverlay(id);
          }}
        />
      </Drawer>
    </>
  );
}
