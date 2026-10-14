"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { RATE_LIMITS, consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/meta/action-result";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required."),
  phoneNumber: z
    .string()
    .trim()
    .min(5, "Enter a valid phone number in international format.")
    .regex(/^[+]?[0-9 ()-]+$/, "Phone number may only contain digits, spaces, +, ( ) and -."),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine((value) => value === undefined || z.string().email().safeParse(value).success, {
      message: "Enter a valid email address.",
    }),
  tags: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  assignedToId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

type ContactInput = z.infer<typeof contactSchema>;

function parse(formData: FormData): { ok: true; data: ContactInput } | { ok: false; message: string } {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
    email: formData.get("email"),
    tags: formData.get("tags"),
    notes: formData.get("notes"),
    assignedToId: formData.get("assignedToId"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid contact details." };
  }
  return { ok: true, data: parsed.data };
}

function toTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function createContact(formData: FormData): Promise<ActionResult> {
  const user = await requirePermission("contacts:manage");

  const limit = await consumeRateLimit(`contact:${user.id}`, RATE_LIMITS.contactWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "contact changes") };
  }

  const parsed = parse(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const phoneNumber = parsed.data.phoneNumber.replace(/\s+/g, "");
  const duplicate = await prisma.contact.findUnique({ where: { phoneNumber } });
  if (duplicate) {
    return { ok: false, message: `A contact with ${phoneNumber} already exists.` };
  }

  const contact = await prisma.contact.create({
    data: {
      name: parsed.data.name,
      phoneNumber,
      email: parsed.data.email ?? null,
      tags: toTags(parsed.data.tags),
      notes: parsed.data.notes || null,
      assignedToId: parsed.data.assignedToId ?? null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CONTACT_CREATED",
      targetType: "contact",
      targetId: contact.id,
      metadata: { name: contact.name, phoneNumber: contact.phoneNumber },
    },
  });

  revalidatePath("/dashboard/contacts");
  return { ok: true, message: `Contact ${contact.name} created.` };
}

export async function updateContact(contactId: string, formData: FormData): Promise<ActionResult> {
  const user = await requirePermission("contacts:manage");

  const limit = await consumeRateLimit(`contact:${user.id}`, RATE_LIMITS.contactWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "contact changes") };
  }

  const parsed = parse(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const phoneNumber = parsed.data.phoneNumber.replace(/\s+/g, "");
  const duplicate = await prisma.contact.findFirst({
    where: { phoneNumber, NOT: { id: contactId } },
  });
  if (duplicate) {
    return { ok: false, message: `Another contact already uses ${phoneNumber}.` };
  }

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: {
      name: parsed.data.name,
      phoneNumber,
      email: parsed.data.email ?? null,
      tags: toTags(parsed.data.tags),
      notes: parsed.data.notes || null,
      assignedToId: parsed.data.assignedToId ?? null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CONTACT_UPDATED",
      targetType: "contact",
      targetId: contact.id,
      metadata: { name: contact.name },
    },
  });

  revalidatePath("/dashboard/contacts");
  return { ok: true, message: `Contact ${contact.name} updated.` };
}

export async function deleteContact(contactId: string): Promise<ActionResult> {
  const user = await requirePermission("contacts:manage");

  const limit = await consumeRateLimit(`contact:${user.id}`, RATE_LIMITS.contactWrite);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "contact changes") };
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { _count: { select: { conversations: true } } },
  });
  if (!contact) return { ok: false, message: "Contact not found." };

  await prisma.contact.delete({ where: { id: contactId } });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CONTACT_DELETED",
      targetType: "contact",
      targetId: contactId,
      metadata: { name: contact.name, conversations: contact._count.conversations },
    },
  });

  revalidatePath("/dashboard/contacts");
  return { ok: true, message: `Contact ${contact.name} deleted.` };
}
