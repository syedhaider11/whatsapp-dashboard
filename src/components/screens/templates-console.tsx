"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, Input, Modal, Textarea, useToast } from "@/components/ui";
import { TEMPLATE_STATUS_META } from "@/lib/templates";
import {
  createTemplate,
  deleteTemplate,
  setTemplateStatus,
  updateTemplate,
} from "@/app/dashboard/templates/actions";

export type TemplateItem = {
  id: string;
  name: string;
  body: string;
  language: string;
  category: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  variables: string[];
  createdByLabel: string;
  updatedLabel: string;
};

export function TemplatesConsole({
  templates,
  canManage,
}: {
  templates: TemplateItem[];
  canManage: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [deleting, setDeleting] = useState<TemplateItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(term) ||
        template.body.toLowerCase().includes(term) ||
        (template.category ?? "").toLowerCase().includes(term),
    );
  }, [templates, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(template: TemplateItem) {
    setEditing(template);
    setFormOpen(true);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateTemplate(editing.id, formData)
        : await createTemplate(formData);
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

  function changeStatus(
    template: TemplateItem,
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED",
  ) {
    startTransition(async () => {
      const result = await setTemplateStatus(template.id, status);
      toast(result.message, result.ok ? "success" : "error");
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteTemplate(deleting.id);
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
        {(["APPROVED", "PENDING", "DRAFT", "REJECTED"] as const).map((status) => (
          <div key={status} className="flex flex-col rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              {TEMPLATE_STATUS_META[status].label}
            </span>
            <span className="tnum mt-space-xs text-headline-md font-bold text-on-surface">
              {templates.filter((template) => template.status === status).length}
            </span>
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
            placeholder="Search templates..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest py-2 pl-9 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:bg-surface focus:outline-none"
          />
        </div>
        {canManage ? (
          <Button onClick={openCreate} className="justify-center gap-1.5">
            <Icon name="add" className="text-[18px]" />
            New Template
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-space-sm lg:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
            <Icon name="mark_chat_read" className="text-[40px] text-on-surface-variant" />
            <p className="text-headline-sm text-on-surface">No templates found</p>
            <p className="text-body-sm text-on-surface-variant">
              {templates.length === 0 ? "Create your first HSM template." : "Try a different search term."}
            </p>
          </div>
        ) : (
          filtered.map((template) => {
            const meta = TEMPLATE_STATUS_META[template.status];
            return (
              <div key={template.id} className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-headline-sm text-on-surface">{template.name}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {template.language}
                      {template.category ? ` · ${template.category}` : ""}
                    </span>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <p className="rounded-lg bg-surface-container-low p-space-sm text-body-sm text-on-surface">
                  {template.body}
                </p>

                {template.variables.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-semibold uppercase text-on-surface-variant">Variables:</span>
                    {template.variables.map((variable) => (
                      <span key={variable} className="rounded bg-secondary-container px-1.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-space-xs">
                  <span className="text-[11px] text-on-surface-variant">
                    {template.createdByLabel} · {template.updatedLabel}
                  </span>
                  {canManage ? (
                    <div className="flex items-center gap-1">
                      {template.status === "APPROVED" ? null : (
                        <button
                          type="button"
                          onClick={() => changeStatus(template, "APPROVED")}
                          disabled={pending}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary-container/40 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {template.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => changeStatus(template, "REJECTED")}
                          disabled={pending}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-error hover:bg-error-container/40 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      ) : null}
                      {template.status === "DRAFT" || template.status === "REJECTED" ? (
                        <button
                          type="button"
                          onClick={() => changeStatus(template, "PENDING")}
                          disabled={pending}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                        >
                          Submit
                        </button>
                      ) : null}
                      <button
                        type="button"
                        aria-label={`Edit ${template.name}`}
                        onClick={() => openEdit(template)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                      >
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${template.name}`}
                        onClick={() => setDeleting(template)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} className="max-w-md">
        <form action={submit} className="flex flex-col gap-space-sm p-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="mark_chat_read" className="text-[22px] text-primary" />
              <h3 className="text-headline-sm text-on-surface">
                {editing ? "Edit Template" : "New Template"}
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

          <Input
            label="Template name"
            name="name"
            defaultValue={editing?.name}
            placeholder="order_shipped_v2"
            hint="Lowercase letters, numbers and underscores only."
            required
          />
          <div className="grid grid-cols-2 gap-space-sm">
            <Input
              label="Language"
              name="language"
              defaultValue={editing?.language ?? "en_US"}
            />
            <Input
              label="Category"
              name="category"
              defaultValue={editing?.category ?? ""}
              placeholder="UTILITY"
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-headline-sm text-on-surface">Body</span>
            <Textarea
              name="body"
              rows={5}
              defaultValue={editing?.body}
              placeholder="Hello {{1}}, your order {{2}} has shipped."
              required
            />
            <span className="text-body-sm text-on-surface-variant">
              Use {`{{1}}`}, {`{{2}}`} ... for dynamic placeholders.
            </span>
          </label>

          <div className="mt-space-xs flex items-center justify-end gap-space-xs">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              <Icon name="save" className="text-[18px]" />
              {pending ? "Saving..." : editing ? "Save draft" : "Create template"}
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
              <h3 className="text-headline-sm text-on-surface">Delete template</h3>
              <p className="text-body-sm text-on-surface-variant">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Permanently remove <span className="font-semibold text-on-surface">{deleting?.name}</span>?
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
