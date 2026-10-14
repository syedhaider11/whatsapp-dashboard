export const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"] as const;

export type RoleName = (typeof ROLES)[number];

export const ROLE_LABELS: Record<RoleName, { label: string; description: string }> = {
  SUPER_ADMIN: { label: "Super Admin", description: "Full platform control across every module and setting." },
  ADMIN: { label: "Admin", description: "Operational administration across WhatsApp, users and configuration." },
  MANAGER: { label: "Manager", description: "Day-to-day messaging, contacts and template operations with audit access." },
  EMPLOYEE: { label: "Employee", description: "Messaging, contacts and document upload with template view access." },
};

export type PermissionGroup = "Dashboard" | "WhatsApp" | "Messaging" | "Contacts" | "Documents" | "Templates" | "Users" | "Audit" | "Settings";

export const PERMISSIONS = [
  { key: "dashboard:view", label: "View dashboard", group: "Dashboard" },
  { key: "whatsapp:connect", label: "Connect WhatsApp", group: "WhatsApp" },
  { key: "whatsapp:disconnect", label: "Disconnect WhatsApp", group: "WhatsApp" },
  { key: "messages:view", label: "View messages", group: "Messaging" },
  { key: "messages:send", label: "Send messages", group: "Messaging" },
  { key: "contacts:manage", label: "Manage contacts", group: "Contacts" },
  { key: "documents:upload", label: "Upload PDF", group: "Documents" },
  { key: "documents:delete", label: "Delete PDF", group: "Documents" },
  { key: "templates:view", label: "View templates", group: "Templates" },
  { key: "templates:manage", label: "Manage templates", group: "Templates" },
  { key: "users:add", label: "Add users", group: "Users" },
  { key: "users:delete", label: "Delete users", group: "Users" },
  { key: "users:change_roles", label: "Change roles", group: "Users" },
  { key: "activity:view", label: "View activity logs", group: "Audit" },
  { key: "settings:manage", label: "Manage system settings", group: "Settings" },
] as const satisfies readonly { key: string; label: string; group: PermissionGroup }[];

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];
export type PermissionKeys = PermissionKey[];

const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.key) as PermissionKeys;

export const ROLE_PERMISSIONS: Record<RoleName, PermissionKeys> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  MANAGER: ["dashboard:view", "messages:view", "messages:send", "contacts:manage", "documents:upload", "templates:view", "templates:manage", "activity:view"],
  EMPLOYEE: ["dashboard:view", "messages:view", "messages:send", "contacts:manage", "documents:upload", "templates:view"],
};

export function hasPermission(
  user: { permissions: PermissionKeys | string[] } | null | undefined,
  permission: string,
): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission as PermissionKey);
}
