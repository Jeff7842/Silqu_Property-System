"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

type ToastTone = "success" | "danger" | "warning" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

const ToastContext = createContext<{ push: (message: string, tone?: ToastTone) => void } | null>(
  null
);

const TONE: Record<ToastTone, { className: string; icon: IconName }> = {
  success: { className: "border-success/30 bg-success/5 text-success", icon: "success" },
  danger: { className: "border-danger/30 bg-danger/5 text-danger", icon: "error" },
  warning: { className: "border-warning/30 bg-warning/5 text-warning", icon: "warning" },
  info: { className: "border-info/30 bg-info/5 text-info", icon: "info" },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex max-w-xs w-full items-start gap-3 rounded-[--radius-control] border bg-surface p-4 shadow-[--shadow-float] ${TONE[t.tone].className}`}
          >
            <Icon name={TONE[t.tone].icon} size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm text-ink">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
