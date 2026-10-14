"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { validateCredentials, GRAPH_VERSION } from "@/lib/meta/client";
import { RATE_LIMITS, consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/meta/action-result";

const credentialsSchema = z.object({
  phoneNumber: z.string().trim().min(5, "Enter the WhatsApp business phone number."),
  phoneNumberId: z.string().trim().min(3, "Enter the Phone Number ID."),
  wabaId: z.string().trim().min(3, "Enter the WhatsApp Business Account ID."),
  accessToken: z.string().trim().min(10, "Enter the permanent system user token."),
});

type Credentials = z.infer<typeof credentialsSchema>;

function parseForm(formData: FormData): { ok: true; data: Credentials } | { ok: false; message: string } {
  const parsed = credentialsSchema.safeParse({
    phoneNumber: formData.get("phoneNumber"),
    phoneNumberId: formData.get("phoneNumberId"),
    wabaId: formData.get("wabaId"),
    accessToken: formData.get("accessToken"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid credentials." };
  }

  return { ok: true, data: parsed.data };
}

export async function testWhatsAppCredentials(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission("whatsapp:connect");

  const limit = await consumeRateLimit(`whatsapp:${user.id}`, RATE_LIMITS.whatsappConnect);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "connection attempts") };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const result = await validateCredentials(parsed.data);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  const name = result.data.verifiedName ?? result.data.displayPhoneNumber ?? "WhatsApp Business";
  return {
    ok: true,
    message: `Meta Graph API handshake successful for ${name} (${GRAPH_VERSION}, quality: ${
      result.data.qualityRating ?? "unknown"
    }).`,
    details: result.data,
  };
}

export async function connectWhatsAppAccount(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission("whatsapp:connect");

  const limit = await consumeRateLimit(`whatsapp:${user.id}`, RATE_LIMITS.whatsappConnect);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "connection attempts") };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const existing = await prisma.whatsAppAccount.findUnique({
    where: { phoneNumberId: parsed.data.phoneNumberId },
  });
  if (existing) {
    await prisma.whatsAppAccount.update({
      where: { id: existing.id },
      data: { status: "CONNECTING", lastError: null },
    });
  }

  const result = await validateCredentials(parsed.data);
  if (!result.ok) {
    await prisma.whatsAppAccount.updateMany({
      where: { phoneNumberId: parsed.data.phoneNumberId },
      data: { status: "ERROR", lastError: result.error, isActive: false },
    });
    return { ok: false, message: result.error };
  }

  const account = await prisma.whatsAppAccount.upsert({
    where: { phoneNumberId: parsed.data.phoneNumberId },
    update: {
      name: result.data.verifiedName ?? result.data.wabaName ?? parsed.data.phoneNumber,
      phoneNumber: parsed.data.phoneNumber,
      wabaId: parsed.data.wabaId,
      accessToken: parsed.data.accessToken,
      status: "CONNECTED",
      qualityRating: result.data.qualityRating ?? null,
      messagingTier: "100K / day",
      isActive: true,
      connectedById: user.id,
      connectedAt: new Date(),
      lastError: null,
    },
    create: {
      name: result.data.verifiedName ?? result.data.wabaName ?? parsed.data.phoneNumber,
      phoneNumber: parsed.data.phoneNumber,
      phoneNumberId: parsed.data.phoneNumberId,
      wabaId: parsed.data.wabaId,
      accessToken: parsed.data.accessToken,
      status: "CONNECTED",
      qualityRating: result.data.qualityRating ?? null,
      messagingTier: "100K / day",
      isActive: true,
      connectedById: user.id,
      connectedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "WHATSAPP_CONNECTED",
      targetType: "whatsapp_account",
      targetId: account.id,
      metadata: { phoneNumber: account.phoneNumber, qualityRating: account.qualityRating },
    },
  });

  revalidatePath("/dashboard/whatsapp");
  return { ok: true, message: `Connected ${account.name} (${account.phoneNumber}).`, details: result.data };
}

export async function disconnectWhatsAppAccount(): Promise<ActionResult> {
  const user = await requirePermission("whatsapp:disconnect");

  const limit = await consumeRateLimit(`whatsapp:${user.id}`, RATE_LIMITS.whatsappConnect);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "connection attempts") };
  }

  const account = await prisma.whatsAppAccount.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!account) {
    return { ok: false, message: "No active WhatsApp account to disconnect." };
  }

  await prisma.whatsAppAccount.update({
    where: { id: account.id },
    data: {
      status: "DISCONNECTED",
      isActive: false,
      accessToken: "",
      lastError: null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "WHATSAPP_DISCONNECTED",
      targetType: "whatsapp_account",
      targetId: account.id,
      metadata: { phoneNumber: account.phoneNumber },
    },
  });

  revalidatePath("/dashboard/whatsapp");
  return { ok: true, message: "Webhook session deactivated. Re-authenticate to reconnect." };
}
