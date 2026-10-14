"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import type { ActionResult } from "@/lib/meta/action-result";

function refresh() {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const user = await requireUser();

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== user.id) {
    return { ok: false, message: "Notification not found." };
  }

  await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  refresh();
  return { ok: true, message: "Marked as read." };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await requireUser();

  const result = await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  refresh();
  return { ok: true, message: `Marked ${result.count} notification${result.count === 1 ? "" : "s"} as read.` };
}

export async function deleteNotification(notificationId: string): Promise<ActionResult> {
  const user = await requireUser();

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== user.id) {
    return { ok: false, message: "Notification not found." };
  }

  await prisma.notification.delete({ where: { id: notificationId } });
  refresh();
  return { ok: true, message: "Notification dismissed." };
}
