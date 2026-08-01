"use client";

import { Drawer, DrawerTrigger, closeOverlay } from "@/components/ui/drawer";
import { buttonClass } from "@/components/ui/button";
import { ComposeForm } from "@/components/announcements/compose-form";

type PropertyOption = { id: string; name: string; units: { id: string; label: string }[] };

export function ComposeDrawer({ properties }: { properties: PropertyOption[] }) {
  return (
    <>
      <DrawerTrigger targetId="compose-announcement-drawer" className={buttonClass()}>
        Compose
      </DrawerTrigger>
      <Drawer id="compose-announcement-drawer" title="Compose announcement">
        <ComposeForm properties={properties} onSuccess={() => closeOverlay("compose-announcement-drawer")} />
      </Drawer>
    </>
  );
}
