import { prisma } from "@/lib/prisma";
import { hasPermission, requireUser } from "@/lib/auth-guard";
import {
  InboxConsole,
  type ConversationListItem,
  type MessageItem,
  type TemplateItem,
} from "@/components/screens/inbox-console";

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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function previewFor(type: string, body: string | null): string {
  if (body) return body;
  switch (type) {
    case "IMAGE":
      return "📷 Image";
    case "DOCUMENT":
      return "📄 Document";
    case "AUDIO":
      return "🎧 Audio";
    case "VIDEO":
      return "🎬 Video";
    case "LOCATION":
      return "📍 Location";
    default:
      return "No messages yet";
  }
}

export const instant = false;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
  });

  const list: ConversationListItem[] = conversations.map((conversation) => {
    const last = conversation.messages[0];
    return {
      id: conversation.id,
      name: conversation.contact.name,
      phone: conversation.contact.phoneNumber,
      tags: conversation.contact.tags,
      unreadCount: conversation.unreadCount,
      preview: last ? previewFor(last.type, last.body) : "No messages yet",
      timeLabel: timeLabel(conversation.lastMessageAt ?? conversation.createdAt),
    };
  });

  const selected =
    conversations.find((conversation) => conversation.id === params.c) ?? conversations[0] ?? null;

  let messages: MessageItem[] = [];
  let lastInboundAt: string | null = null;

  if (selected) {
    const rows = await prisma.message.findMany({
      where: { conversationId: selected.id },
      orderBy: { createdAt: "asc" },
    });

    messages = rows.map((row) => ({
      id: row.id,
      direction: row.direction,
      type: row.type,
      body: row.body,
      time: timeLabel(row.createdAt),
      dayLabel: dayLabel(row.createdAt),
      status: row.status,
      errorMessage: row.errorMessage,
    }));

    const lastInbound = [...rows].reverse().find((row) => row.direction === "INBOUND");
    lastInboundAt = lastInbound ? lastInbound.createdAt.toISOString() : null;
  }

  const templateRows = await prisma.messageTemplate.findMany({
    where: { status: "APPROVED" },
    orderBy: { name: "asc" },
  });
  const templates: TemplateItem[] = templateRows.map((template) => ({
    id: template.id,
    name: template.name,
    body: template.body,
  }));

  return (
    <InboxConsole
      conversations={list}
      selectedId={selected?.id ?? null}
      messages={messages}
      templates={templates}
      lastInboundAt={lastInboundAt}
      canSend={hasPermission(user, "messages:send")}
    />
  );
}
