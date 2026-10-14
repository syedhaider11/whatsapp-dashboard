"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Icon, Input, Modal, useToast } from "@/components/ui";
import { ROLES, ROLE_LABELS, type RoleName } from "@/lib/permissions";
import { changeUserRole, createUser, deleteUser, setUserActive } from "@/app/dashboard/users/actions";

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  roleLabel: string;
  isActive: boolean;
  lastLoginLabel: string;
  createdAtLabel: string;
};

export function UsersConsole({
  users,
  currentUserId,
  canAdd,
  canChangeRoles,
  canDelete,
}: {
  users: UserItem[];
  currentUserId: string;
  canAdd: boolean;
  canChangeRoles: boolean;
  canDelete: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<UserItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.roleLabel.toLowerCase().includes(term),
    );
  }, [users, search]);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createUser(formData);
      if (!result.ok) {
        toast(result.message, "error");
        return;
      }
      toast(result.message, "success");
      setFormOpen(false);
      router.refresh();
    });
  }

  function onRoleChange(user: UserItem, role: RoleName) {
    if (role === user.role) return;
    startTransition(async () => {
      const result = await changeUserRole(user.id, role);
      toast(result.message, result.ok ? "success" : "error");
      router.refresh();
    });
  }

  function toggleActive(user: UserItem) {
    startTransition(async () => {
      const result = await setUserActive(user.id, !user.isActive);
      toast(result.message, result.ok ? "success" : "error");
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteUser(deleting.id);
      if (!result.ok) {
        toast(result.message, "error");
        return;
      }
      toast(result.message, "success");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="grid grid-cols-2 gap-space-sm lg:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className="flex flex-col rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              {ROLE_LABELS[role].label}
            </span>
            <span className="tnum mt-space-xs text-headline-md font-bold text-on-surface">
              {users.filter((user) => user.role === role).length}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex flex-1 items-center">
          <Icon name="search" className="pointer-events-none absolute left-3 text-[18px] text-outline" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by name, email or role..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest py-2 pl-9 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:bg-surface focus:outline-none"
          />
        </div>
        {canAdd ? (
          <Button onClick={() => setFormOpen(true)} className="justify-center gap-1.5">
            <Icon name="person_add" className="text-[18px]" />
            Add User
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-space-xs">
        {filtered.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <div
              key={user.id}
              className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-space-sm">
                <Avatar name={user.name} online={user.isActive} />
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-headline-sm text-on-surface">{user.name}</span>
                    {isSelf ? <Badge tone="primary">You</Badge> : null}
                    {!user.isActive ? <Badge tone="danger">Inactive</Badge> : null}
                  </div>
                  <span className="truncate text-body-sm text-on-surface-variant">{user.email}</span>
                  <span className="text-[11px] text-on-surface-variant">
                    Last login {user.lastLoginLabel} · Joined {user.createdAtLabel}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-space-xs">
                {canChangeRoles && !isSelf ? (
                  <select
                    aria-label={`Role for ${user.name}`}
                    value={user.role}
                    onChange={(event) => onRoleChange(user, event.target.value as RoleName)}
                    disabled={pending}
                    className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 py-1.5 text-label-sm text-on-surface focus:outline-none"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role].label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone="secondary">{user.roleLabel}</Badge>
                )}

                {canChangeRoles && !isSelf ? (
                  <button
                    type="button"
                    aria-label={user.isActive ? `Deactivate ${user.name}` : `Activate ${user.name}`}
                    onClick={() => toggleActive(user)}
                    disabled={pending}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <Icon name={user.isActive ? "toggle_on" : "toggle_off"} className="text-[24px]" />
                  </button>
                ) : null}

                {canDelete && !isSelf ? (
                  <button
                    type="button"
                    aria-label={`Delete ${user.name}`}
                    onClick={() => setDeleting(user)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                  >
                    <Icon name="person_remove" className="text-[20px]" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} className="max-w-md">
        <form action={submit} className="flex flex-col gap-space-sm p-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="person_add" className="text-[22px] text-primary" />
              <h3 className="text-headline-sm text-on-surface">New User</h3>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setFormOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <Input label="Full name" name="name" required />
          <Input label="Work email" name="email" type="email" required />
          <label className="flex flex-col gap-1">
            <span className="text-headline-sm text-on-surface">Role</span>
            <select
              name="role"
              defaultValue="EMPLOYEE"
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface focus:outline-none"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role].label} — {ROLE_LABELS[role].description}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Temporary password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            required
          />

          <div className="mt-space-xs flex items-center justify-end gap-space-xs">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              <Icon name="save" className="text-[18px]" />
              {pending ? "Creating..." : "Create user"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} className="max-w-sm">
        <div className="flex flex-col gap-space-sm p-space-md">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container text-on-error-container">
              <Icon name="person_remove" className="text-[22px]" />
            </span>
            <div>
              <h3 className="text-headline-sm text-on-surface">Delete user</h3>
              <p className="text-body-sm text-on-surface-variant">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Remove <span className="font-semibold text-on-surface">{deleting?.name}</span> ({deleting?.email})
            from the portal?
          </p>
          <div className="flex items-center justify-end gap-space-xs">
            <Button type="button" variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={pending}>
              <Icon name="delete" className="text-[18px]" />
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
