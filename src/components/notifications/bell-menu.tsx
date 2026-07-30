"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/server/actions/notification.actions";

type NotificationRow = { id: string; title: string; body: string; link: string | null; readAt: Date | null; createdAt: Date };

export function BellMenu({ notifications, unreadCount }: { notifications: NotificationRow[]; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function openNotification(n: NotificationRow) {
    setOpen(false);
    startTransition(async () => {
      if (!n.readAt) await markNotificationReadAction(n.id);
      if (n.link) router.push(n.link);
      else router.refresh();
    });
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-full p-2 text-ink-muted hover:bg-canvas" aria-label="Notifications">
        <Icon name="notifications" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-[--radius-card] border border-line bg-surface shadow-[--shadow-float]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-sm font-semibold text-ink">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  disabled={isPending}
                  onClick={() => startTransition(async () => { await markAllNotificationsReadAction(); router.refresh(); })}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-ink-muted">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-canvas ${!n.readAt ? "bg-primary/5" : ""}`}
                  >
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
