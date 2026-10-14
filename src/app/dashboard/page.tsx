import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { GRAPH_VERSION } from "@/lib/meta/client";
import {
  OverviewScreen,
  type OverviewData,
  type OverviewBadgeTone,
} from "@/components/screens/overview";

export const instant = false;

const HOUR_MS = 60 * 60 * 1000;
const TRAFFIC_BUCKETS = 24;

function timeAgo(date: Date): string {
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function clockLabel(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function prettifyAction(action: string): string {
  return action
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function describeActivity(metadata: unknown, targetType: string | null): string {
  const parts: string[] = [];
  if (targetType) parts.push(targetType.replaceAll("_", " "));
  if (metadata && typeof metadata === "object") {
    for (const [key, value] of Object.entries(metadata as Record<string, unknown>).slice(0, 2)) {
      if (value === null || value === undefined || value === "") continue;
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.join(" · ") || "No additional details.";
}

function actionTone(action: string): OverviewBadgeTone {
  if (action.startsWith("DOCUMENT")) return "primary";
  if (action.startsWith("WEBHOOK")) return "secondary";
  if (action.includes("FAILED") || action.includes("ERROR")) return "danger";
  return "neutral";
}

export default async function DashboardPage() {
  await requireUser();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const since = new Date(now.getTime() - (TRAFFIC_BUCKETS - 1) * HOUR_MS);

  const [
    account,
    contacts,
    conversations,
    unreadAgg,
    activeToday,
    documentAgg,
    recentConversations,
    logs,
    recentMessages,
  ] = await Promise.all([
    prisma.whatsAppAccount.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.contact.count(),
    prisma.conversation.count(),
    prisma.conversation.aggregate({ _sum: { unreadCount: true } }),
    prisma.conversation.count({ where: { lastMessageAt: { gte: startOfToday } } }),
    prisma.document.aggregate({ _count: { _all: true }, _sum: { chunkCount: true } }),
    prisma.conversation.findMany({
      take: 5,
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      include: { contact: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.activityLog.findMany({ take: 6, orderBy: { createdAt: "desc" } }),
    prisma.message.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const traffic = new Array<number>(TRAFFIC_BUCKETS).fill(0);
  for (const message of recentMessages) {
    const index = Math.min(
      TRAFFIC_BUCKETS - 1,
      Math.max(0, Math.floor((message.createdAt.getTime() - since.getTime()) / HOUR_MS)),
    );
    traffic[index] += 1;
  }
  const avgPerHour = Math.round(recentMessages.length / TRAFFIC_BUCKETS);

  const data: OverviewData = {
    account: account
      ? {
          name: account.name,
          phoneNumber: account.phoneNumber,
          status: account.status,
          qualityRating: account.qualityRating,
          messagingTier: account.messagingTier,
          processedEvents: account.processedEvents,
        }
      : null,
    metrics: {
      unread: unreadAgg._sum.unreadCount ?? 0,
      conversations,
      activeToday,
      contacts,
      documents: documentAgg._count._all,
      chunks: documentAgg._sum.chunkCount ?? 0,
    },
    traffic,
    avgPerHour,
    graphVersion: GRAPH_VERSION,
    inquiries: recentConversations
      .filter((conversation) => conversation.messages[0])
      .map((conversation) => {
        const last = conversation.messages[0];
        return {
          id: conversation.id,
          name: conversation.contact.name,
          phone: conversation.contact.phoneNumber,
          preview: last.body ?? `[${last.type.toLowerCase()}]`,
          time: timeAgo(conversation.lastMessageAt ?? conversation.createdAt),
          unread: conversation.unreadCount,
          tag: conversation.contact.tags[0] ?? "Conversation",
        };
      }),
    audit: logs.map((log) => ({
      id: log.id,
      title: prettifyAction(log.action),
      time: clockLabel(log.createdAt),
      body: describeActivity(log.metadata, log.targetType),
      tone: actionTone(log.action),
    })),
  };

  return <OverviewScreen data={data} />;
}
