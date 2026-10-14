import type { MessageType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyMetaSignature } from "@/lib/meta/signature";

type InboundMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { mime_type?: string; caption?: string };
  document?: { mime_type?: string; filename?: string; caption?: string };
  audio?: { mime_type?: string };
  video?: { mime_type?: string };
  location?: { latitude?: number; longitude?: number };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};

type WebhookChange = {
  field?: string;
  value?: {
    metadata?: { display_phone_number?: string; phone_number_id?: string };
    contacts?: { profile?: { name?: string }; wa_id?: string }[];
    messages?: InboundMessage[];
    statuses?: {
      id?: string;
      status?: string;
      timestamp?: string;
      errors?: { title?: string; message?: string }[];
    }[];
  };
};

type WebhookPayload = {
  object?: string;
  entry?: { id?: string; changes?: WebhookChange[] }[];
};

function resolveType(type: string | undefined): MessageType {
  switch (type) {
    case "image":
      return "IMAGE";
    case "document":
      return "DOCUMENT";
    case "audio":
      return "AUDIO";
    case "video":
      return "VIDEO";
    case "location":
      return "LOCATION";
    case "template":
      return "TEMPLATE";
    default:
      return "TEXT";
  }
}

function resolveBody(message: InboundMessage): string | null {
  if (message.text?.body) return message.text.body;
  if (message.document?.filename) return `📄 ${message.document.filename}`;
  if (message.image) return message.image.caption ?? "📷 Image";
  if (message.audio) return "🎧 Audio message";
  if (message.video) return "🎬 Video message";
  if (message.location) return `📍 ${message.location.latitude}, ${message.location.longitude}`;
  if (message.button?.text) return message.button.text;
  if (message.interactive?.button_reply?.title) return message.interactive.button_reply.title;
  if (message.interactive?.list_reply?.title) return message.interactive.list_reply.title;
  return null;
}

function parseTimestamp(value: string | undefined): Date {
  const seconds = value ? Number(value) : NaN;
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : new Date();
}

async function handleMessage(change: WebhookChange): Promise<void> {
  const value = change.value;
  const phoneNumberId = value?.metadata?.phone_number_id;
  if (!phoneNumberId || !value?.messages?.length) return;

  const account = await prisma.whatsAppAccount.findUnique({ where: { phoneNumberId } });
  if (!account) return;

  const nameByWaId = new Map(
    (value.contacts ?? []).map((contact) => [contact.wa_id ?? "", contact.profile?.name ?? ""]),
  );
  let processed = 0;

  for (const message of value.messages) {
    const from = message.from;
    if (!from) continue;

    const contact = await prisma.contact.upsert({
      where: { phoneNumber: from },
      update: { lastInteractionAt: new Date() },
      create: {
        phoneNumber: from,
        name: nameByWaId.get(from) || from,
        lastInteractionAt: new Date(),
      },
    });

    let conversation = await prisma.conversation.findFirst({
      where: { whatsappAccountId: account.id, contactId: contact.id, status: { not: "CLOSED" } },
      orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          whatsappAccountId: account.id,
          contactId: contact.id,
          status: "OPEN",
          unreadCount: 0,
          lastMessageAt: new Date(),
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        status: "RECEIVED",
        type: resolveType(message.type),
        body: resolveBody(message),
        waMessageId: message.id ?? null,
        createdAt: parseTimestamp(message.timestamp),
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: parseTimestamp(message.timestamp), unreadCount: { increment: 1 } },
    });

    if (account.connectedById) {
      await prisma.notification.create({
        data: {
          userId: account.connectedById,
          type: "MESSAGE",
          title: "New inbound message",
          body: `${contact.name}: ${resolveBody(message) ?? "New message"}`,
          link: "/dashboard/inbox",
        },
      });
    }

    processed += 1;
  }

  if (processed > 0) {
    await prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: { processedEvents: { increment: processed } },
    });
    await prisma.activityLog.create({
      data: {
        action: "WEBHOOK_MESSAGES_RECEIVED",
        targetType: "whatsapp_account",
        targetId: account.id,
        metadata: { count: processed, phoneNumberId },
      },
    });
  }
}

async function handleStatuses(change: WebhookChange): Promise<void> {
  const statuses = change.value?.statuses;
  if (!statuses?.length) return;

  for (const status of statuses) {
    if (!status.id || !status.status) continue;

    const message = await prisma.message.findUnique({ where: { waMessageId: status.id } });
    if (!message) continue;

    const data: Prisma.MessageUpdateInput = {};
    const at = parseTimestamp(status.timestamp);

    if (status.status === "delivered") {
      data.status = "DELIVERED";
      data.deliveredAt = at;
    } else if (status.status === "read") {
      data.status = "READ";
      data.readAt = at;
    } else if (status.status === "failed") {
      data.status = "FAILED";
      data.errorMessage = status.errors?.[0]?.message ?? "Delivery failed.";
    } else if (status.status === "sent") {
      data.status = "SENT";
    }

    if (Object.keys(data).length > 0) {
      await prisma.message.update({ where: { id: message.id }, data });
    }
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    process.env.META_WEBHOOK_VERIFY_TOKEN &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature, process.env.META_APP_SECRET)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return new Response("BAD REQUEST", { status: 400 });
  }

  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.value?.messages?.length) await handleMessage(change);
        if (change.value?.statuses?.length) await handleStatuses(change);
      }
    }
  } catch (error) {
    console.error("WhatsApp webhook processing failed", error);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
