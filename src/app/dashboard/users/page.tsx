import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermissionPage } from "@/lib/auth-guard";
import { ROLE_LABELS } from "@/lib/permissions";
import { UsersConsole, type UserItem } from "@/components/screens/users-console";

function relativeLabel(date: Date | null): string {
  if (!date) return "never";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const instant = false;

export default async function UsersPage() {
  const actor = await requirePermissionPage("users:add");

  const profiles = await prisma.profile.findMany({
    include: { role: true },
    orderBy: [{ role: { name: "asc" } }, { name: "asc" }],
  });

  const users: UserItem[] = profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role.name,
    roleLabel: ROLE_LABELS[profile.role.name].label,
    isActive: profile.isActive,
    lastLoginLabel: relativeLabel(profile.lastLoginAt),
    createdAtLabel: relativeLabel(profile.createdAt),
  }));

  return (
    <UsersConsole
      users={users}
      currentUserId={actor.id}
      canAdd={hasPermission(actor, "users:add")}
      canChangeRoles={hasPermission(actor, "users:change_roles")}
      canDelete={hasPermission(actor, "users:delete")}
    />
  );
}
