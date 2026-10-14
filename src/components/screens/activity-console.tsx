"use client";

import { useMemo, useState } from "react";
import { Avatar, Icon } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  userName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  time: string;
  dayLabel: string;
};

const ACTION_WRAP: Record<string, string> = {
  CONTACT_CREATED: "bg-primary-container text-on-primary-container",
  CONTACT_UPDATED: "bg-secondary-container text-on-secondary-container",
  CONTACT_DELETED: "bg-error-container text-on-error-container",
  TEMPLATE_CREATED: "bg-primary-container text-on-primary-container",
  TEMPLATE_UPDATED: "bg-secondary-container text-on-secondary-container",
  TEMPLATE_DELETED: "bg-error-container text-on-error-container",
  TEMPLATE_STATUS_CHANGED: "bg-surface-container-highest text-on-surface",
  WHATSAPP_CONNECTED: "bg-primary text-on-primary",
  WHATSAPP_DISCONNECTED: "bg-error-container text-on-error-container",
  USER_CREATED: "bg-primary-container text-on-primary-container",
  USER_ROLE_CHANGED: "bg-secondary-container text-on-secondary-container",
  USER_DELETED: "bg-error-container text-on-error-container",
  SETTINGS_UPDATED: "bg-surface-container-highest text-on-surface",
};

function actionLabel(action: string): string {
  return action
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function ActivityConsole({ entries }: { entries: ActivityItem[] }) {
  const [search, setSearch] = useState("");

  const actions = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.action));
    return [...unique].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(
      (entry) =>
        entry.userName.toLowerCase().includes(term) ||
        entry.action.toLowerCase().includes(term) ||
        (entry.targetType ?? "").toLowerCase().includes(term) ||
        (entry.metadata ?? "").toLowerCase().includes(term),
    );
  }, [entries, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const entry of filtered) {
      const list = map.get(entry.dayLabel) ?? [];
      list.push(entry);
      map.set(entry.dayLabel, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="flex flex-col gap-space-md">
      <div className="grid grid-cols-3 gap-space-sm">
        {[
          { label: "Total Events", value: entries.length, icon: "receipt_long" },
          { label: "Action Types", value: actions.length, icon: "category" },
          { label: "Operators", value: new Set(entries.map((e) => e.userName)).size, icon: "group" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">{stat.label}</span>
              <Icon name={stat.icon} className="text-[18px] text-primary" />
            </div>
            <span className="tnum mt-space-xs text-headline-md font-bold text-on-surface">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="relative flex items-center">
        <Icon name="search" className="pointer-events-none absolute left-3 text-[18px] text-outline" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by operator, action or target..."
          className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest py-2 pl-9 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:bg-surface focus:outline-none"
        />
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
          <Icon name="history_toggle_off" className="text-[40px] text-on-surface-variant" />
          <p className="text-headline-sm text-on-surface">No activity recorded</p>
          <p className="text-body-sm text-on-surface-variant">
            Administrative actions will appear here as the team uses the portal.
          </p>
        </div>
      ) : (
        grouped.map(([day, items]) => (
          <div key={day} className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-headline-sm text-on-surface">{day}</span>
              <span className="text-label-sm text-on-surface-variant">{items.length} event{items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="flex flex-col gap-space-sm border-l-2 border-surface-container-high pl-space-md">
              {items.map((entry) => (
                <div key={entry.id} className="relative flex flex-col gap-1">
                  <span
                    className={cn(
                      "absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-surface-container-lowest",
                      (ACTION_WRAP[entry.action] ?? "bg-surface-container-highest").split(" ")[0],
                    )}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-space-xs">
                      <Avatar name={entry.userName} size="sm" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-headline-sm text-on-surface">
                          {actionLabel(entry.action)}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {entry.userName}
                          {entry.targetType ? ` · ${entry.targetType}` : ""}
                          {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-on-surface-variant">{entry.time}</span>
                  </div>
                  {entry.metadata ? (
                    <p className="truncate rounded-lg bg-surface-container-low px-2 py-1 font-mono text-[11px] text-on-surface-variant">
                      {entry.metadata}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
