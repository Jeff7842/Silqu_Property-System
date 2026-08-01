"use client";

import { Drawer, DrawerTrigger, closeOverlay } from "@/components/ui/drawer";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TenantForm } from "@/components/tenants/tenant-form";
import { createTenantAction, updateTenantAction } from "@/server/actions/tenant.actions";

export function AddTenantDrawer() {
  const { push } = useToast();
  return (
    <>
      <DrawerTrigger targetId="add-tenant-drawer" className={buttonClass()}>
        Add tenant
      </DrawerTrigger>
      <Drawer id="add-tenant-drawer" title="Add tenant">
        <TenantForm
          action={createTenantAction}
          submitLabel="Create tenant"
          onSuccess={() => {
            push("Tenant created.", "success");
            closeOverlay("add-tenant-drawer");
          }}
        />
      </Drawer>
    </>
  );
}

/** Second trigger for the same drawer (e.g. an empty-state CTA) : never render a second <AddTenantDrawer/>, its id isn't unique. */
export function AddTenantTrigger() {
  return (
    <DrawerTrigger targetId="add-tenant-drawer" className={buttonClass()}>
      Add tenant
    </DrawerTrigger>
  );
}

export function EditTenantDrawer({
  tenantId,
  defaults,
}: {
  tenantId: string;
  defaults: {
    fullName: string;
    nationalId: string;
    phone: string;
    email: string | null;
    nextOfKinName: string | null;
    nextOfKinPhone: string | null;
  };
}) {
  const { push } = useToast();
  const id = `edit-tenant-drawer-${tenantId}`;
  return (
    <>
      <DrawerTrigger targetId={id} className={buttonClass("secondary")}>
        Edit
      </DrawerTrigger>
      <Drawer id={id} title="Edit tenant">
        <TenantForm
          action={updateTenantAction.bind(null, tenantId)}
          defaults={defaults}
          submitLabel="Save changes"
          onSuccess={() => {
            push("Tenant updated.", "success");
            closeOverlay(id);
          }}
        />
      </Drawer>
    </>
  );
}
