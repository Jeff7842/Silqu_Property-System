"use client";

import { useActionState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addMaintenanceCommentAction } from "@/server/actions/maintenance.actions";

type Comment = { id: string; body: string; createdAt: Date; user: { fullName: string }; userId: string };

export function CommentThread({ requestId, comments, currentUserId }: { requestId: string; comments: Comment[]; currentUserId: string }) {
  const [state, formAction, pending] = useActionState(addMaintenanceCommentAction.bind(null, requestId), undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <p className="text-sm text-ink-muted">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const mine = c.userId === currentUserId;
            return (
              <div key={c.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] rounded-[--radius-control] px-4 py-2 text-sm ${mine ? "bg-primary text-white" : "bg-canvas text-ink"}`}>
                  {c.body}
                </div>
                <span className="text-xs text-ink-muted">{c.user.fullName} · {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(c.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <Textarea name="body" placeholder="Write a comment…" rows={2} required />
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" variant="secondary" loading={pending} className="self-start">Send</Button>
      </form>
    </div>
  );
}
