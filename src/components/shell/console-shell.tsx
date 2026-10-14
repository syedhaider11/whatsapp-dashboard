"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS, NAV_ITEMS, type NavItem, type ShellUser } from "@/lib/nav";
import { Avatar, Icon } from "@/components/ui";

function canSee(user: ShellUser, item: NavItem): boolean {
  return !item.permission || user.permissions.includes(item.permission);
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const PILL_TONES: Record<NonNullable<NavItem["pillTone"]>, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
};

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-space-xs", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
        <Icon name="forum" className="text-[22px]" filled />
      </span>
      <div className="flex flex-col">
        <span className="text-headline-sm leading-tight tracking-tight text-on-surface">
          WABA Ops Portal
        </span>
        <span className="tnum text-label-sm text-on-surface-variant">v20.0 Core</span>
      </div>
    </div>
  );
}

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[44px] items-center justify-between rounded-xl px-space-md py-space-sm transition-colors",
        active
          ? "bg-primary-container font-semibold text-on-primary-container"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
      )}
    >
      <span className="flex items-center gap-space-md">
        <Icon name={item.icon} className="text-[20px]" />
        <span className="text-body-md">{item.label}</span>
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-medium",
          PILL_TONES[item.pillTone ?? "neutral"],
        )}
      >
        {item.pill}
      </span>
    </Link>
  );
}

function RailContent({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => canSee(user, item));
  return (
    <>
      <div className="flex h-20 items-center px-space-lg">
        <BrandMark />
      </div>
      <div className="mx-space-md mb-space-sm rounded-xl bg-surface-container p-space-md">
        <div className="flex items-center gap-space-sm">
          <Avatar name={user.name} size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-headline-sm text-on-surface">
              {user.name}
            </span>
            <span className="text-label-sm font-bold text-primary">
              {user.roleLabel}
            </span>
            <span className="truncate text-[10px] text-on-surface-variant">
              {user.email}
            </span>
          </div>
        </div>
      </div>
      <div className="px-space-md pb-space-xs">
        <div className="flex items-center justify-between rounded-lg bg-surface-container-high/60 px-space-sm py-space-xs">
          <span className="text-label-sm text-on-surface-variant">API Health</span>
          <span className="flex items-center gap-1 text-label-sm font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> 99.98% SLA
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-space-sm py-space-xs">
        {items.map((item) => (
          <NavRow key={item.key} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
      <div className="space-y-space-sm bg-surface-container-low p-space-md">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex min-h-[44px] w-full items-center gap-space-md rounded-xl px-space-md py-space-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Icon name="logout" className="text-[20px]" />
          <span className="text-body-md">Sign out</span>
        </button>
        <div className="rounded-xl bg-surface px-space-md py-space-sm text-center">
          <p className="text-[10px] font-medium leading-relaxed text-on-surface-variant">
            Internal Business Portal · Meta Cloud API v20.0 · PostgreSQL &amp; ChromaDB
            Integrated
          </p>
        </div>
      </div>
    </>
  );
}

function BottomNav({
  user,
  onOpenMenu,
}: {
  user: ShellUser;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const items = BOTTOM_NAV_ITEMS.filter((item) => canSee(user, item));
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface/90 backdrop-blur-xl lg:hidden">
      <div className="flex h-20 items-center justify-around px-space-xs">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-14 min-w-[56px] flex-col items-center justify-center gap-1 transition-colors",
                active
                  ? "font-bold text-primary"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              <span className="relative">
                <Icon name={item.icon} className="text-[22px]" />
                {item.key === "inbox" ? (
                  <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </span>
              <span className="text-[11px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-14 min-w-[56px] flex-col items-center justify-center gap-1 text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <Icon name="apps" className="text-[22px]" />
          <span className="text-[11px]">Menu</span>
        </button>
      </div>
    </nav>
  );
}

export function ConsoleShell({
  user,
  notifications,
  account,
  children,
}: {
  user: ShellUser;
  notifications: { unread: number };
  account: { phoneNumber: string | null; connected: boolean };
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-outline-variant/40 bg-surface-container-lowest lg:flex">
        <RailContent user={user} />
      </aside>

      <div
        aria-hidden
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm transition-opacity lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setDrawerOpen(false);
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface-container-lowest shadow-2xl transition-transform lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="absolute right-2 top-4 flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
        >
          <Icon name="close" className="text-[22px]" />
        </button>
        <RailContent user={user} />
      </aside>

      <header className="pt-safe fixed inset-x-0 top-0 z-30 h-20 border-b border-outline-variant/40 bg-surface/85 backdrop-blur-xl lg:left-[260px]">
        <div className="flex h-20 items-center justify-between gap-space-sm px-space-md">
          <div className="flex min-w-0 items-center gap-space-sm">
            <button
              type="button"
              aria-label="Open operations navigation"
              onClick={() => setDrawerOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container lg:hidden"
            >
              <Icon name="menu_open" className="text-[22px]" />
            </button>
            <BrandMark className="lg:hidden" />
            <span className="hidden text-headline-md text-on-surface lg:block">
              Operations Console
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-space-sm">
            <span className="hidden items-center gap-space-xs rounded-full bg-surface-container px-space-sm py-1 text-label-sm font-medium text-primary sm:flex">
              <span className="relative flex h-2 w-2">
                {account.connected ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-fixed-dim opacity-75" />
                ) : null}
                <span
                  className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    account.connected ? "bg-primary" : "bg-outline",
                  )}
                />
              </span>
              <span className="tnum text-[11px] text-on-surface-variant">
                {account.phoneNumber ?? "Not connected"}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  account.connected ? "text-primary" : "text-on-surface-variant",
                )}
              >
                {account.connected ? "Meta Live" : "Offline"}
              </span>
            </span>
            <Link
              href="/dashboard/notifications"
              aria-label={`System notifications (${notifications.unread} unread)`}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container"
            >
              <Icon name="notifications" className="text-[22px]" />
              {notifications.unread > 0 ? (
                <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
                  {notifications.unread > 99 ? "99+" : notifications.unread}
                </span>
              ) : null}
            </Link>
            <Avatar name={user.name} size="sm" />
          </div>
        </div>
      </header>

      <main className="pb-safe min-h-screen pt-20 pb-24 lg:pb-8 lg:pl-[260px]">
        <div className="mx-auto w-full max-w-[1400px] px-space-md py-space-sm lg:px-space-2xl lg:py-space-xl">
          {children}
        </div>
      </main>

      <BottomNav user={user} onOpenMenu={() => setDrawerOpen(true)} />
    </div>
  );
}
