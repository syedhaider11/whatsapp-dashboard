import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { PermissionKey } from "@/lib/permissions";

export class ForbiddenError extends Error {
  constructor(permission: PermissionKey) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireUser();
  if (!user.permissions.includes(permission)) {
    throw new ForbiddenError(permission);
  }
  return user;
}

export async function requirePermissionPage(permission: PermissionKey) {
  const user = await requireUser();
  if (!user.permissions.includes(permission)) {
    redirect("/dashboard");
  }
  return user;
}

export function hasPermission(
  user: { permissions: PermissionKey[] } | null | undefined,
  permission: PermissionKey,
): boolean {
  return Boolean(user?.permissions.includes(permission));
}
