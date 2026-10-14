import { prisma } from "@/lib/prisma";
import { requirePermissionPage } from "@/lib/auth-guard";
import { ActivityConsole, type ActivityItem } from "@/components/screens/activity-console";

function timeLabel(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDay) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function summarize(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  return Object.entries(metadata as Record<string, unknown>)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join(" · ");
}

export const instant = false;

export default async function ActivityLogsPage() {
  await requirePermissionPage("activity:view");

  const logs = await prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const entries: ActivityItem[] = logs.map((log) => ({
    id: log.id,
    userName: log.user?.name ?? "System",
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: summarize(log.metadata),
    ipAddress: log.ipAddress,
    time: timeLabel(log.createdAt),
    dayLabel: dayLabel(log.createdAt),
  }));

  return <ActivityConsole entries={entries} />;
}
