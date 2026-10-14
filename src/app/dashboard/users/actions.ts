"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { ROLES, type RoleName } from "@/lib/permissions";
import type { ActionResult } from "@/lib/meta/action-result";

const userSchema = z.object({
  name: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(ROLES),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function createUser(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("users:add");

  const limit = await consumeRateLimit(`user:${actor.id}`, RATE_LIMITS.userAdmin);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "user changes") };
  }

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid user details." };
  }

  const existing = await prisma.profile.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { ok: false, message: `A user with ${parsed.data.email} already exists.` };
  }

  const role = await prisma.role.findUnique({ where: { name: parsed.data.role } });
  if (!role) {
    return { ok: false, message: "Selected role was not found." };
  }

  const profile = await prisma.profile.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      roleId: role.id,
      isActive: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      action: "USER_CREATED",
      targetType: "profile",
      targetId: profile.id,
      metadata: { email: profile.email, role: parsed.data.role },
    },
  });

  revalidatePath("/dashboard/users");
  return { ok: true, message: `User ${profile.name} created as ${role.label}.` };
}

export async function changeUserRole(userId: string, roleName: RoleName): Promise<ActionResult> {
  const actor = await requirePermission("users:change_roles");

  const limit = await consumeRateLimit(`user:${actor.id}`, RATE_LIMITS.userAdmin);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "user changes") };
  }

  if (actor.id === userId) {
    return { ok: false, message: "You cannot change your own role." };
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return { ok: false, message: "Role not found." };

  const profile = await prisma.profile.update({
    where: { id: userId },
    data: { roleId: role.id },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      action: "USER_ROLE_CHANGED",
      targetType: "profile",
      targetId: profile.id,
      metadata: { email: profile.email, role: roleName },
    },
  });

  revalidatePath("/dashboard/users");
  return { ok: true, message: `${profile.name} is now ${role.label}.` };
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const actor = await requirePermission("users:change_roles");

  const limit = await consumeRateLimit(`user:${actor.id}`, RATE_LIMITS.userAdmin);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "user changes") };
  }

  if (actor.id === userId) {
    return { ok: false, message: "You cannot deactivate your own account." };
  }

  const profile = await prisma.profile.update({
    where: { id: userId },
    data: { isActive },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      targetType: "profile",
      targetId: profile.id,
      metadata: { email: profile.email },
    },
  });

  revalidatePath("/dashboard/users");
  return { ok: true, message: `${profile.name} ${isActive ? "activated" : "deactivated"}.` };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const actor = await requirePermission("users:delete");

  const limit = await consumeRateLimit(`user:${actor.id}`, RATE_LIMITS.userAdmin);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "user changes") };
  }

  if (actor.id === userId) {
    return { ok: false, message: "You cannot delete your own account." };
  }

  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) return { ok: false, message: "User not found." };

  await prisma.profile.delete({ where: { id: userId } });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      action: "USER_DELETED",
      targetType: "profile",
      targetId: userId,
      metadata: { email: profile.email },
    },
  });

  revalidatePath("/dashboard/users");
  return { ok: true, message: `User ${profile.name} deleted.` };
}
