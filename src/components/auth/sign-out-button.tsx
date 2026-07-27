"use client";

import { Button } from "@/components/ui/button";

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <Button variant="secondary" size="sm" onClick={() => action()}>
      Sign out
    </Button>
  );
}
