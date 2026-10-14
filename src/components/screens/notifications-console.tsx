"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/dashboard/notifications/actions";

export type NotificationItem = {
  id: string;
  type: "MESSAGE" | "CONNECTION" | "API_ERROR" | "USER" | "SYSTEM";
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  time: string;
  dayLabel: string;
};

const TYPE_META: Record<NotificationItem["type"], { icon: string; wrap: string; label: string }> = {
  MESSAGE: { icon: "chat", wrap: "bg-primary-container text-on-primary-container", label: "Message" },
  CONNECTION: { icon: "link", wrap: "bg-secondary-container text-on-secondary-container", label: "Connection" },
  API_ERROR: { icon: "error", wrap: "bg-error-container text-on-error-container", label: "API Error" },
  USER: { icon: "person", wrap: "bg-surface-container-highest text-on-surface", label: "User" },
  SYSTEM: { icon: "settings", wrap: "bg-surface-container-highest text-on-surface", label: "System" },
};

export function NotificationsConsole({ notifications }: { notifications: NotificationItem[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unread = notifications.filter((item) => !item.isRead).length;
  const visible = filter === "unread" ? notifications.filter((item) => !item.isRead) : notifications;

  function markAll() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      toast(result.message, result.ok ? "success" : "error");
      router.refresh();
    });
  }

  function markOne(item: NotificationItem) {
    if (item.isRead) return;
    startTransition(async () => {
      await markNotificationRead(item.id);
      router.refresh();
    });
  }

  function dismiss(item: NotificationItem) {
    startTransition(async () => {
      const result = await deleteNotification(item.id);
      toast(result.message, result.ok ? "success" : "error");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
            <Icon name="notifications" className="text-[22px]" />
          </span>
          <div className="flex flex-col">
            <span className="text-headline-sm text-on-surface">{unread} unread</span>
            <span className="text-body-sm text-on-surface-variant">
              {notifications.length} total notification{notifications.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden items-center rounded-lg bg-surface-container-lowest p-0.5 sm:flex">
            {(["all", "unread"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={cn(
                  "rounded-md px-3 py-1 text-label-sm font-semibold capitalize transition-colors",
                  filter === option ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            onClick={markAll}
            disabled={pending || unread === 0}
            className="gap-1.5"
          >
            <Icon name="done_all" className="text-[18px]" />
            Mark all read
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
          <Icon name="notifications_off" className="text-[40px] text-on-surface-variant" />
          <p className="text-headline-sm text-on-surface">
            {filter === "unread" ? "You're all caught up" : "No notifications yet"}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {filter === "unread" ? "No unread notifications." : "Alerts and system events will appear here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-space-xs">
          {visible.map((item) => {
            const meta = TYPE_META[item.type];
            const inner = (
              <div className="flex min-w-0 flex-1 items-start gap-space-sm">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.wrap)}>
                  <Icon name={meta.icon} className="text-[20px]" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-headline-sm text-on-surface">{item.title}</span>
                    <Badge tone="outline">{meta.label}</Badge>
                    {!item.isRead ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                  </div>
                  {item.body ? (
                    <p className="text-body-sm text-on-surface-variant">{item.body}</p>
                  ) : null}
                  <span className="text-[11px] text-on-surface-variant">
                    {item.dayLabel} · {item.time}
                  </span>
                </div>
              </div>
            );

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start justify-between gap-space-sm rounded-xl p-space-sm shadow-sm transition-colors",
                  item.isRead ? "bg-surface-container-lowest" : "bg-secondary-container/25",
                )}
              >
                {item.link ? (
                  <Link
                    href={item.link}
                    onClick={() => markOne(item)}
                    className="flex min-w-0 flex-1 items-start"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={() => markOne(item)} className="flex min-w-0 flex-1 items-start text-left">
                    {inner}
                  </button>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  {!item.isRead ? (
                    <button
                      type="button"
                      aria-label="Mark as read"
                      onClick={() => markOne(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                    >
                      <Icon name="mark_email_read" className="text-[18px]" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => dismiss(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                  >
                    <Icon name="close" className="text-[18px]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
