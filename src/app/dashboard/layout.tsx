import type { ReactNode } from "react";
import { ConsoleShell } from "@/components/shell/console-shell";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const [unreadNotifications, account] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.whatsAppAccount.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      select: { phoneNumber: true, status: true },
    }),
  ]);

  return (
    <ConsoleShell
      user={{
        name: user.name ?? "Operator",
        email: user.email ?? "",
        roleLabel: user.roleLabel,
        permissions: user.permissions,
      }}
      notifications={{ unread: unreadNotifications }}
      account={{
        phoneNumber: account?.phoneNumber ?? null,
        connected: account?.status === "CONNECTED",
      }}
    >
      {children}
    </ConsoleShell>
  );
}
