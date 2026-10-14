"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { sendTextMessage } from "@/lib/meta/client";
import { RATE_LIMITS, consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/meta/action-result";

const sendSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, "Type a message before sending.").max(4096, "Message exceeds 4096 characters."),
});

export async function sendConversationMessage(input: {
  conversationId: string;
  body: string;
}): Promise<ActionResult> {
  const user = await requirePermission("messages:send");

  const limit = await consumeRateLimit(`message:${user.id}`, RATE_LIMITS.sendMessage);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "messages") };
  }

  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: parsed.data.conversationId },
    include: { contact: true, whatsappAccount: true },
  });

  if (!conversation) {
    return { ok: false, message: "Conversation not found." };
  }

  const account = conversation.whatsappAccount;
  if (!account || !account.isActive || !account.accessToken) {
    return { ok: false, message: "WhatsApp account is not connected." };
  }

  const result = await sendTextMessage({
    phoneNumberId: account.phoneNumberId,
    accessToken: account.accessToken,
    to: conversation.contact.phoneNumber,
    body: parsed.data.body,
  });

  if (!result.ok) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        status: "FAILED",
        type: "TEXT",
        body: parsed.data.body,
        sentById: user.id,
        errorMessage: result.error,
      },
    });
    revalidatePath("/dashboard/inbox");
    return { ok: false, message: result.error };
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUTBOUND",
      status: "SENT",
      type: "TEXT",
      body: parsed.data.body,
      waMessageId: result.data.waMessageId ?? null,
      sentById: user.id,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath("/dashboard/inbox");
  return { ok: true, message: "Message dispatched via Meta Cloud API." };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await requirePermission("messages:view");

  await prisma.conversation.updateMany({
    where: { id: conversationId, unreadCount: { gt: 0 } },
    data: { unreadCount: 0 },
  });

  revalidatePath("/dashboard/inbox");
}
