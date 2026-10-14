"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Icon, Modal, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { markConversationRead, sendConversationMessage } from "@/app/dashboard/inbox/actions";

export type ConversationListItem = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  unreadCount: number;
  preview: string;
  timeLabel: string;
};

export type MessageItem = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  type: "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO" | "VIDEO" | "TEMPLATE" | "LOCATION";
  body: string | null;
  time: string;
  dayLabel: string;
  status: "RECEIVED" | "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  errorMessage: string | null;
};

export type TemplateItem = {
  id: string;
  name: string;
  body: string;
};

const ATTACHMENTS = [
  { label: "PDF / Document", value: "PDF Compliance Document", icon: "picture_as_pdf", wrap: "bg-error-container text-on-error-container" },
  { label: "ChromaDB Chunk", value: "ChromaDB Knowledge Chunk", icon: "database", wrap: "bg-secondary-container text-on-secondary-container" },
  { label: "Catalog Item", value: "Approved Product Catalog", icon: "storefront", wrap: "bg-primary-container text-on-primary-container" },
  { label: "Approved Media", value: "High-Res Media Asset", icon: "image", wrap: "bg-surface-container-highest text-on-surface" },
];

const STATUS_ICON: Record<MessageItem["status"], string> = {
  RECEIVED: "download_done",
  QUEUED: "schedule_send",
  SENT: "check",
  DELIVERED: "done_all",
  READ: "done_all",
  FAILED: "error",
};

const MEDIA_ICON: Record<MessageItem["type"], string> = {
  TEXT: "chat",
  IMAGE: "image",
  DOCUMENT: "picture_as_pdf",
  AUDIO: "graphic_eq",
  VIDEO: "movie",
  TEMPLATE: "mark_chat_read",
  LOCATION: "location_on",
};

function subscribeToClock(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

function readClockMinute(): number {
  return Math.floor(Date.now() / 30_000);
}

function readClockMinuteServer(): number {
  return -1;
}

export function InboxConsole({
  conversations,
  selectedId,
  messages,
  templates,
  lastInboundAt,
  canSend,
}: {
  conversations: ConversationListItem[];
  selectedId: string | null;
  messages: MessageItem[];
  templates: TemplateItem[];
  lastInboundAt: string | null;
  canSend: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const clockMinute = useSyncExternalStore(subscribeToClock, readClockMinute, readClockMinuteServer);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((item) => item.id === selectedId) ?? null;
  const ragMode = input.startsWith("/rag");

  const careWindow = useMemo(() => {
    if (!lastInboundAt) return { active: false, label: "Awaiting inbound message" };
    if (clockMinute < 0) return { active: false, label: "Calculating session window..." };
    const expiresAt = new Date(lastInboundAt).getTime() + 24 * 60 * 60 * 1000;
    const remainingMs = expiresAt - clockMinute * 30_000;
    if (remainingMs <= 0) return { active: false, label: "24h session window expired" };
    const hours = Math.floor(remainingMs / 3_600_000);
    const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
    return { active: true, label: `${hours}h ${minutes}m remaining` };
  }, [lastInboundAt, clockMinute]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.phone.toLowerCase().includes(term),
    );
  }, [conversations, search]);

  useEffect(() => {
    if (selected && selected.unreadCount > 0) {
      void markConversationRead(selected.id);
    }
  }, [selected]);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [selectedId, messages.length]);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }

  function quickFill(phrase: string) {
    setInput(phrase);
    requestAnimationFrame(() => {
      resize();
      textareaRef.current?.focus();
    });
  }

  async function dispatch() {
    if (!selected) return;
    const text = input.trim();
    if (!text) return;
    if (!canSend) {
      toast("Your role does not permit sending messages.", "error");
      return;
    }

    setSending(true);
    const result = await sendConversationMessage({ conversationId: selected.id, body: text });
    setSending(false);

    if (!result.ok) {
      toast(result.message, "error");
      return;
    }

    setInput("");
    requestAnimationFrame(resize);
    toast(result.message, "success");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-space-sm">
      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-sm lg:p-space-md">
        <div className="relative flex w-full items-center">
          <Icon name="search" className="pointer-events-none absolute left-3 text-[18px] text-outline" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search contacts or numbers..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest py-2 pl-9 pr-8 text-body-sm text-on-surface placeholder:text-outline focus:bg-surface focus:outline-none"
          />
          <span className="absolute right-3 text-label-sm text-on-surface-variant">
            {filtered.length}
          </span>
        </div>

        <div className="no-scrollbar flex max-h-56 flex-col gap-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-1 py-2 text-body-sm text-on-surface-variant">No conversations found.</p>
          ) : (
            filtered.map((item) => {
              const active = item.id === selectedId;
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/inbox?c=${item.id}`}
                  className={cn(
                    "flex items-center gap-space-sm rounded-lg p-space-sm transition-colors",
                    active ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-container",
                  )}
                >
                  <Avatar name={item.name} size="sm" online={active} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-headline-sm text-on-surface">{item.name}</span>
                      <span className="shrink-0 text-[10px] text-on-surface-variant">{item.timeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-body-sm text-on-surface-variant">{item.preview}</span>
                      {item.unreadCount > 0 ? (
                        <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
                          {item.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {selected ? (
        <>
          <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex min-w-0 items-center gap-space-sm">
              <Avatar name={selected.name} size="md" online />
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-headline-sm text-on-surface">{selected.name}</h2>
                  {selected.tags[0] ? <Badge tone="secondary">{selected.tags[0]}</Badge> : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-body-sm text-on-surface-variant">{selected.phone}</span>
                  <span className="text-[10px] text-outline">•</span>
                  <span className="flex items-center gap-0.5 text-label-sm font-medium text-primary">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    Online via WhatsApp
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Customer profile details"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="badge" className="text-[20px]" />
              </button>
              <button
                type="button"
                aria-label="More thread options"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="more_vert" className="text-[20px]" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-container p-space-sm shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <Icon name="schedule" className="text-[16px]" />
              </span>
              <div className="flex flex-col">
                <span className="text-label-sm font-semibold text-on-surface">Meta 24h Care Window</span>
                <span className="text-[11px] text-on-surface-variant">
                  {careWindow.active ? (
                    <>
                      Session window: <span className="font-bold text-primary">{careWindow.label}</span>
                    </>
                  ) : (
                    <span className="text-error">{careWindow.label}</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-surface-container-lowest px-2 py-1">
              <Icon name="psychology" className="text-[14px] text-secondary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">RAG Online</span>
            </div>
          </div>

          <div ref={streamRef} className="flex max-h-[52vh] flex-col gap-space-md overflow-y-auto rounded-xl bg-surface-container-low p-space-md">
            {messages.length === 0 ? (
              <p className="text-center text-body-sm text-on-surface-variant">No messages yet. Start the conversation below.</p>
            ) : (
              messages.map((item, index) => {
                const prev = messages[index - 1];
                const out = item.direction === "OUTBOUND";
                return (
                  <div key={item.id} className="flex flex-col gap-space-md">
                    {!prev || prev.dayLabel !== item.dayLabel ? (
                      <div className="my-space-xs flex items-center justify-center">
                        <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant shadow-sm">
                          {item.dayLabel}
                        </span>
                      </div>
                    ) : null}

                    {item.type === "TEXT" || item.type === "TEMPLATE" ? (
                      <div className={cn("flex flex-col", out ? "items-end self-end" : "items-start self-start")}>
                        <div
                          className={cn(
                            "max-w-[88%] rounded-xl p-space-md shadow-sm",
                            out
                              ? "rounded-tr-none bg-secondary-container text-on-secondary-container"
                              : "rounded-tl-none bg-surface-container-lowest text-on-surface",
                          )}
                        >
                          <p className="whitespace-pre-wrap text-body-md leading-relaxed">{item.body}</p>
                          <div className="mt-1 flex items-center justify-end gap-1">
                            <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                            {out ? (
                              <Icon
                                name={STATUS_ICON[item.status]}
                                filled
                                className={cn("text-[15px]", item.status === "FAILED" ? "text-error" : "text-primary")}
                              />
                            ) : null}
                          </div>
                        </div>
                        {item.errorMessage ? (
                          <span className="mr-2 mt-0.5 text-[10px] text-error">{item.errorMessage}</span>
                        ) : null}
                      </div>
                    ) : (
                      <div className={cn("flex flex-col", out ? "items-end self-end" : "items-start self-start")}>
                        <div className={cn("flex max-w-[88%] flex-col gap-2 rounded-xl rounded-tr-none p-space-sm shadow-sm", out ? "bg-secondary-container" : "rounded-tr-xl rounded-tl-none bg-surface-container-lowest")}>
                          <div className="flex items-center gap-space-sm rounded-lg bg-surface-container-lowest p-2">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error-container text-on-error-container">
                              <Icon name={MEDIA_ICON[item.type]} className="text-[24px]" />
                            </span>
                            <div className="flex min-w-0 flex-col pr-2">
                              <span className="truncate text-headline-sm text-on-surface">{item.body ?? "Media"}</span>
                              <span className="text-[11px] text-on-surface-variant">{item.type} attachment</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1 px-1">
                            <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                            {out ? <Icon name={STATUS_ICON[item.status]} filled className="text-[15px] text-primary" /> : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-space-xs">
            <button
              type="button"
              onClick={() => quickFill("/rag query cloud retention")}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-on-surface hover:bg-secondary-container"
            >
              <Icon name="bolt" className="text-[14px] text-primary" />
              /rag query cloud retention
            </button>
            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              disabled={templates.length === 0}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-primary-container px-2.5 py-1 text-label-sm font-semibold text-on-primary-container hover:opacity-90 disabled:opacity-50"
            >
              <Icon name="mark_chat_read" className="text-[14px]" />
              Use Meta HSM Template
            </button>
          </div>

          <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex items-end gap-space-xs">
              <button
                type="button"
                aria-label="Attach documents, media or ChromaDB chunks"
                onClick={() => setAttachOpen((open) => !open)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              >
                <Icon name="attach_file" className="text-[20px]" />
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl bg-surface-container-low px-3 py-2 focus-within:bg-surface-container">
                <textarea
                  ref={textareaRef}
                  value={input}
                  rows={1}
                  onChange={(event) => setInput(event.target.value)}
                  onInput={resize}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void dispatch();
                    }
                  }}
                  placeholder="Type a message or use /rag for document search..."
                  className="max-h-24 w-full resize-none overflow-y-auto bg-transparent text-body-md leading-normal text-on-surface placeholder:text-outline focus:outline-none"
                />
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    {ragMode ? (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-primary">
                        RAG Mode Active
                      </span>
                    ) : null}
                    <span className="text-[10px] text-outline">{input.length} / 4096</span>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">Tier 3 Meta SLA Live</span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Send WhatsApp message"
                onClick={dispatch}
                disabled={sending || !canSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50"
              >
                <Icon name={sending ? "autorenew" : "send"} className={cn("text-[20px]", sending && "animate-spin")} />
              </button>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                <Icon name="verified_user" className="text-[13px] text-primary" />
                Official WhatsApp Business API Account
              </span>
              <span className="text-[10px] text-outline">Meta Cloud v20.0</span>
            </div>
          </div>

          {attachOpen ? (
            <div className="animate-fade-in flex items-center justify-around rounded-xl bg-surface-container px-space-sm py-space-sm shadow-inner">
              {ATTACHMENTS.map((asset) => (
                <button
                  key={asset.value}
                  type="button"
                  onClick={() => {
                    setAttachOpen(false);
                    quickFill(`Sending attachment [${asset.value}] with verified cryptographic hash.`);
                  }}
                  className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-surface-container-high"
                >
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", asset.wrap)}>
                    <Icon name={asset.icon} className="text-[20px]" />
                  </span>
                  <span className="text-[11px] text-on-surface">{asset.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
          <Icon name="forum" className="text-[40px] text-on-surface-variant" />
          <p className="text-headline-sm text-on-surface">No conversations yet</p>
          <p className="text-body-sm text-on-surface-variant">
            Incoming WhatsApp messages will appear here once the webhook receives them.
          </p>
        </div>
      )}

      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} align="bottom" className="max-w-lg">
        <div className="flex items-center justify-between bg-surface-container-low p-space-md">
          <div className="flex items-center gap-2">
            <Icon name="mark_chat_read" className="text-[22px] text-primary" />
            <div>
              <h3 className="text-headline-sm text-on-surface">Meta Approved HSM Templates</h3>
              <p className="text-label-sm text-on-surface-variant">Pre-approved message envelopes</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setTemplateOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="flex flex-col gap-space-sm p-space-md">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setTemplateOpen(false);
                quickFill(template.body);
              }}
              className="flex flex-col gap-1 rounded-xl bg-surface-container p-space-sm text-left transition-colors hover:bg-surface-container-high"
            >
              <div className="flex items-center justify-between">
                <span className="text-headline-sm text-on-surface">{template.name}</span>
                <Badge tone="primary">Approved</Badge>
              </div>
              <p className="text-body-sm text-on-surface-variant">{template.body}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
