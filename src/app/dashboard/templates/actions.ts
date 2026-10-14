"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { extractVariables } from "@/lib/templates";
import { RATE_LIMITS, consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/meta/action-result";

const templateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Template name must be at least 3 characters.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores only."),
  body: z.string().trim().min(1, "Template body is required."),
  language: z.string().trim().min(2, "Language code is required.").default("en_US"),
  category: z.string().trim().optional().default(""),
});

function parse(formData: FormData): { ok: true; data: z.infer<typeof templateSchema> } | { ok: false; message: string } {
  const parsed = templateSchema.safeParse({
    name: formData.get("name"),
    body: formData.get("body"),
    language: formData.get("language") ?? "en_US",
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid template." };
  }
  return { ok: true, data: parsed.data };
}

export async function createTemplate(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission("templates:manage");

  const limit = await consumeRateLimit(`template:${user.id}`, RATE_LIMITS.templateWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "template changes") };
  }

  const parsed = parse(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const duplicate = await prisma.messageTemplate.findUnique({ where: { name: parsed.data.name } });
  if (duplicate) {
    return { ok: false, message: `Template "${parsed.data.name}" already exists.` };
  }

  const template = await prisma.messageTemplate.create({
    data: {
      name: parsed.data.name,
      body: parsed.data.body,
      language: parsed.data.language,
      category: parsed.data.category || null,
      status: "DRAFT",
      variables: extractVariables(parsed.data.body),
      createdById: user.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "TEMPLATE_CREATED",
      targetType: "message_template",
      targetId: template.id,
      metadata: { name: template.name, variables: template.variables },
    },
  });

  revalidatePath("/dashboard/templates");
  return { ok: true, message: `Template "${template.name}" saved as draft.` };
}

export async function updateTemplate(templateId: string, formData: FormData): Promise<ActionResult> {
  const user = await requirePermission("templates:manage");

  const limit = await consumeRateLimit(`template:${user.id}`, RATE_LIMITS.templateWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "template changes") };
  }

  const parsed = parse(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const duplicate = await prisma.messageTemplate.findFirst({
    where: { name: parsed.data.name, NOT: { id: templateId } },
  });
  if (duplicate) {
    return { ok: false, message: `Another template already uses "${parsed.data.name}".` };
  }

  const template = await prisma.messageTemplate.update({
    where: { id: templateId },
    data: {
      name: parsed.data.name,
      body: parsed.data.body,
      language: parsed.data.language,
      category: parsed.data.category || null,
      variables: extractVariables(parsed.data.body),
      status: "DRAFT",
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "TEMPLATE_UPDATED",
      targetType: "message_template",
      targetId: template.id,
      metadata: { name: template.name },
    },
  });

  revalidatePath("/dashboard/templates");
  return { ok: true, message: `Template "${template.name}" updated.` };
}

export async function setTemplateStatus(
  templateId: string,
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED",
): Promise<ActionResult> {
  const user = await requirePermission("templates:manage");

  const limit = await consumeRateLimit(`template:${user.id}`, RATE_LIMITS.templateWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "template changes") };
  }

  const template = await prisma.messageTemplate.update({
    where: { id: templateId },
    data: { status },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "TEMPLATE_STATUS_CHANGED",
      targetType: "message_template",
      targetId: template.id,
      metadata: { name: template.name, status },
    },
  });

  revalidatePath("/dashboard/templates");
  return { ok: true, message: `Template "${template.name}" marked ${status.toLowerCase()}.` };
}

export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  const user = await requirePermission("templates:manage");

  const limit = await consumeRateLimit(`template:${user.id}`, RATE_LIMITS.templateWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "template changes") };
  }

  const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
  if (!template) return { ok: false, message: "Template not found." };

  await prisma.messageTemplate.delete({ where: { id: templateId } });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "TEMPLATE_DELETED",
      targetType: "message_template",
      targetId: templateId,
      metadata: { name: template.name },
    },
  });

  revalidatePath("/dashboard/templates");
  return { ok: true, message: `Template "${template.name}" deleted.` };
}
