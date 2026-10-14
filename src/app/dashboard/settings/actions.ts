"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { RATE_LIMITS, consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/meta/action-result";

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Account label must be at least 2 characters."),
  webhookUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine((value) => value === undefined || /^https?:\/\/.+/.test(value), {
      message: "Webhook URL must start with http:// or https://.",
    }),
  messagingTier: z.string().trim().optional().default(""),
});

export async function updateSystemSettings(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("settings:manage");

  const limit = await consumeRateLimit(`settings:${actor.id}`, RATE_LIMITS.settingsWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "setting updates") };
  }

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    webhookUrl: formData.get("webhookUrl"),
    messagingTier: formData.get("messagingTier"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  const account = await prisma.whatsAppAccount.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!account) {
    return { ok: false, message: "No active WhatsApp account to configure." };
  }

  await prisma.whatsAppAccount.update({
    where: { id: account.id },
    data: {
      name: parsed.data.name,
      webhookUrl: parsed.data.webhookUrl ?? null,
      messagingTier: parsed.data.messagingTier || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      action: "SETTINGS_UPDATED",
      targetType: "whatsapp_account",
      targetId: account.id,
      metadata: { name: parsed.data.name, webhookUrl: parsed.data.webhookUrl ?? null },
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true, message: "System settings updated." };
}
