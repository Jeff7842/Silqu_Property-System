"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import type { NavItem } from "@/lib/nav";

export function PortalShell({
  brandTitle,
  brandSubtitle,
  navItems,
  user,
  onSignOut,
  addAction,
  children,
}: {
  brandTitle: string;
  brandSubtitle: string;
  navItems: NavItem[];
  user: { fullName: string; role: string };
  onSignOut: () => Promise<void>;
  addAction?: { label: string; href: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-page">
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 flex h-full w-[260px] flex-col bg-navy py-6 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex flex-col gap-1 px-6">
          <span className="text-2xl font-bold tracking-tight text-white">{brandTitle}</span>
          <span className="text-xs uppercase tracking-wider text-white/60">{brandSubtitle}</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/app" && item.href !== "/my" && item.href !== "/platform" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-[--radius-control] px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "border-l-4 border-accent bg-primary text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-white/10 px-4 pt-4">
          {addAction && (
            <Link
              href={addAction.href}
              className="mb-3 flex h-10 items-center justify-center gap-2 rounded-[--radius-control] bg-accent text-sm font-semibold text-navy hover:opacity-90"
            >
              <Icon name="add" size={18} />
              {addAction.label}
            </Link>
          )}
          <button
            onClick={() => onSignOut()}
            className="flex items-center gap-3 rounded-[--radius-control] px-4 py-2 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-[260px]">
        <header className="fixed right-0 top-0 z-10 flex h-16 w-full items-center justify-between border-b border-line bg-surface px-4 lg:left-[260px] lg:w-[calc(100%-260px)] lg:px-8">
          <button
            aria-label="Open menu"
            className="rounded-[--radius-control] p-2 text-ink hover:bg-canvas lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" size={24} />
          </button>
          <span className="hidden text-sm font-semibold text-ink-muted lg:block" />
          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 text-ink-muted hover:bg-canvas" aria-label="Notifications">
              <Icon name="notifications" size={20} />
            </button>
            <div className="ml-2 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-ink leading-tight">{user.fullName}</p>
                <p className="text-xs text-ink-muted leading-tight">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-16 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
