"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resendInvitationAction, revokeInvitationAction } from "@/server/actions/tenant.actions";

type Invitation = { id: string; email: string; expiresAt: Date; tenant: { fullName: string } | null };

export function InvitationRow({ invitation }: { invitation: Invitation }) {
  const [isPending, startTransition] = useTransition();
  const expired = invitation.expiresAt < new Date();

  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <div>
        <p className="font-medium text-ink">{invitation.tenant?.fullName ?? invitation.email}</p>
        <p className="text-xs text-ink-muted">
          {invitation.email} · {expired ? "Expired" : `Expires ${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(invitation.expiresAt)}`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(async () => { await resendInvitationAction(invitation.id); })}
        >
          Resend
        </Button>
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() => startTransition(async () => { await revokeInvitationAction(invitation.id); })}
        >
          Revoke
        </Button>
      </div>
    </div>
  );
}
