import type { PermissionKey } from "@/lib/permissions";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  pill: string;
  pillTone?: "neutral" | "primary" | "secondary";
  permission?: PermissionKey;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "grid_view", pill: "Live", pillTone: "neutral", permission: "dashboard:view" },
  { key: "whatsapp", label: "WhatsApp", href: "/dashboard/whatsapp", icon: "phone_in_talk", pill: "Online", pillTone: "secondary", permission: "dashboard:view" },
  { key: "inbox", label: "Inbox", href: "/dashboard/inbox", icon: "chat", pill: "14", pillTone: "primary", permission: "messages:view" },
  { key: "contacts", label: "Contacts", href: "/dashboard/contacts", icon: "contacts", pill: "2.8k", pillTone: "neutral", permission: "contacts:manage" },
  { key: "documents", label: "Documents / PDFs", href: "/dashboard/documents", icon: "folder_data", pill: "ChromaDB", pillTone: "neutral", permission: "documents:upload" },
  { key: "templates", label: "Message Templates", href: "/dashboard/templates", icon: "mark_chat_read", pill: "HSM", pillTone: "neutral", permission: "templates:view" },
  { key: "users", label: "Users & Roles", href: "/dashboard/users", icon: "shield_person", pill: "RBAC", pillTone: "neutral", permission: "users:add" },
  { key: "activity", label: "Activity Logs", href: "/dashboard/activity-logs", icon: "receipt_long", pill: "Audit", pillTone: "neutral", permission: "activity:view" },
  { key: "settings", label: "Settings", href: "/dashboard/settings", icon: "settings", pill: "Config", pillTone: "neutral", permission: "settings:manage" },
];

export const BOTTOM_NAV_KEYS = ["dashboard", "inbox", "documents", "whatsapp"] as const;

export const BOTTOM_NAV_ITEMS: NavItem[] = BOTTOM_NAV_KEYS.map(
  (key) => NAV_ITEMS.find((item) => item.key === key)!,
);

export type ShellUser = {
  name: string;
  email: string;
  roleLabel: string;
  permissions: PermissionKey[];
};
