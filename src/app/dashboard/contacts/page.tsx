import { prisma } from "@/lib/prisma";
import { hasPermission, requireUser } from "@/lib/auth-guard";
import { ROLE_LABELS } from "@/lib/permissions";
import {
  ContactsConsole,
  type ContactItem,
  type MemberOption,
} from "@/components/screens/contacts-console";

function relativeLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const instant = false;

export default async function ContactsPage() {
  const user = await requireUser();

  const [contacts, members] = await Promise.all([
    prisma.contact.findMany({
      include: {
        assignedTo: true,
        _count: { select: { conversations: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.profile.findMany({
      where: { isActive: true },
      include: { role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const items: ContactItem[] = contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phoneNumber,
    email: contact.email,
    tags: contact.tags,
    notes: contact.notes,
    ownerId: contact.assignedToId,
    ownerName: contact.assignedTo?.name ?? null,
    conversationCount: contact._count.conversations,
    createdAtLabel: relativeLabel(contact.createdAt),
  }));

  const memberOptions: MemberOption[] = members.map((member) => ({
    id: member.id,
    name: member.name,
    roleLabel: ROLE_LABELS[member.role.name].label,
  }));

  return (
    <ContactsConsole
      contacts={items}
      members={memberOptions}
      canManage={hasPermission(user, "contacts:manage")}
    />
  );
}
