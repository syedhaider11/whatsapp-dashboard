"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Icon, Input, Modal, Textarea, useToast } from "@/components/ui";
import { createContact, deleteContact, updateContact } from "@/app/dashboard/contacts/actions";

export type ContactItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  notes: string | null;
  ownerId: string | null;
  ownerName: string | null;
  conversationCount: number;
  createdAtLabel: string;
};

export type MemberOption = { id: string; name: string; roleLabel: string };

export function ContactsConsole({
  contacts,
  members,
  canManage,
}: {
  contacts: ContactItem[];
  members: MemberOption[];
  canManage: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContactItem | null>(null);
  const [deleting, setDeleting] = useState<ContactItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(term) ||
        contact.phone.toLowerCase().includes(term) ||
        (contact.email ?? "").toLowerCase().includes(term) ||
        contact.tags.some((tag) => tag.toLowerCase().includes(term)),
    );
  }, [contacts, search]);

  const unassigned = contacts.filter((contact) => !contact.ownerId).length;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(contact: ContactItem) {
    setEditing(contact);
    setFormOpen(true);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateContact(editing.id, formData)
        : await createContact(formData);
      if (!result.ok) {
        toast(result.message, "error");
        return;
      }
      toast(result.message, "success");
      setFormOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteContact(deleting.id);
      if (!result.ok) {
        toast(result.message, "error");
        return;
      }
      toast(result.message, "success");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="grid grid-cols-2 gap-space-sm lg:grid-cols-4">
        {[
          { label: "Total Contacts", value: contacts.length, icon: "contacts" },
          { label: "Tagged", value: contacts.filter((c) => c.tags.length > 0).length, icon: "sell" },
          { label: "Unassigned", value: unassigned, icon: "person_alert" },
          { label: "With Threads", value: contacts.filter((c) => c.conversationCount > 0).length, icon: "forum" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">{stat.label}</span>
              <Icon name={stat.icon} className="text-[18px] text-primary" />
            </div>
            <span className="tnum mt-space-xs text-headline-md font-bold text-on-surface">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex flex-1 items-center">
          <Icon name="search" className="pointer-events-none absolute left-3 text-[18px] text-outline" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone, email or tag..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest py-2 pl-9 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:bg-surface focus:outline-none"
          />
        </div>
        {canManage ? (
          <Button onClick={openCreate} className="justify-center gap-1.5">
            <Icon name="person_add" className="text-[18px]" />
            Add Contact
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-space-xs">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
            <Icon name="person_search" className="text-[40px] text-on-surface-variant" />
            <p className="text-headline-sm text-on-surface">No contacts found</p>
            <p className="text-body-sm text-on-surface-variant">
              {contacts.length === 0 ? "Add your first WhatsApp contact to get started." : "Try a different search term."}
            </p>
          </div>
        ) : (
          filtered.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-space-sm">
                <Avatar name={contact.name} />
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-headline-sm text-on-surface">{contact.name}</span>
                    {contact.tags.map((tag) => (
                      <Badge key={tag} tone="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="truncate text-body-sm text-on-surface-variant">
                    {contact.phone}
                    {contact.email ? ` · ${contact.email}` : ""}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Added {contact.createdAtLabel} · {contact.conversationCount} thread
                    {contact.conversationCount === 1 ? "" : "s"}
                    {contact.ownerName ? ` · Owner ${contact.ownerName}` : " · Unassigned"}
                  </span>
                </div>
              </div>
              {canManage ? (
                <div className="flex shrink-0 items-center gap-1 lg:self-start">
                  <button
                    type="button"
                    aria-label={`Edit ${contact.name}`}
                    onClick={() => openEdit(contact)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <Icon name="edit" className="text-[20px]" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${contact.name}`}
                    onClick={() => setDeleting(contact)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                  >
                    <Icon name="delete" className="text-[20px]" />
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} className="max-w-md">
        <form
          action={submit}
          className="flex flex-col gap-space-sm p-space-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name={editing ? "edit" : "person_add"} className="text-[22px] text-primary" />
              <h3 className="text-headline-sm text-on-surface">
                {editing ? "Edit Contact" : "New Contact"}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setFormOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <Input label="Full name" name="name" defaultValue={editing?.name} required />
          <Input
            label="WhatsApp number"
            name="phoneNumber"
            defaultValue={editing?.phone}
            placeholder="+1 555 010 2233"
            required
          />
          <Input
            label="Email (optional)"
            name="email"
            type="email"
            defaultValue={editing?.email ?? ""}
          />
          <Input
            label="Tags (comma separated)"
            name="tags"
            defaultValue={editing?.tags.join(", ")}
            placeholder="vip, billing, lead"
          />
          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-semibold text-on-surface-variant">Assigned operator</span>
            <select
              name="assignedToId"
              defaultValue={editing?.ownerId ?? ""}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface focus:outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.roleLabel}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-headline-sm text-on-surface">Notes (optional)</span>
            <Textarea name="notes" rows={3} defaultValue={editing?.notes ?? ""} />
          </label>

          <div className="mt-space-xs flex items-center justify-end gap-space-xs">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              <Icon name="save" className="text-[18px]" />
              {pending ? "Saving..." : editing ? "Save changes" : "Create contact"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} className="max-w-sm">
        <div className="flex flex-col gap-space-sm p-space-md">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container text-on-error-container">
              <Icon name="delete_forever" className="text-[22px]" />
            </span>
            <div>
              <h3 className="text-headline-sm text-on-surface">Delete contact</h3>
              <p className="text-body-sm text-on-surface-variant">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">{deleting?.name}</span> and{" "}
            {deleting?.conversationCount ?? 0} conversation thread
            {(deleting?.conversationCount ?? 0) === 1 ? "" : "s"} with all their messages will be
            permanently removed.
          </p>
          <div className="flex items-center justify-end gap-space-xs">
            <Button type="button" variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={pending}>
              <Icon name="delete" className="text-[18px]" />
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
