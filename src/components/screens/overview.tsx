import Link from "next/link";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Icon,
  ProgressBar,
  StatusChip,
  type ConnectionState,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export type OverviewBadgeTone =
  | "primary"
  | "secondary"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "outline";

export type OverviewData = {
  account: {
    name: string;
    phoneNumber: string;
    status: string;
    qualityRating: string | null;
    messagingTier: string | null;
    processedEvents: number;
  } | null;
  metrics: {
    unread: number;
    conversations: number;
    activeToday: number;
    contacts: number;
    documents: number;
    chunks: number;
  };
  traffic: number[];
  avgPerHour: number;
  graphVersion: string;
  inquiries: {
    id: string;
    name: string;
    phone: string;
    preview: string;
    time: string;
    unread: number;
    tag: string;
  }[];
  audit: {
    id: string;
    title: string;
    time: string;
    body: string;
    tone: OverviewBadgeTone;
  }[];
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function connectionState(status: string | undefined): ConnectionState {
  switch (status) {
    case "CONNECTED":
      return "connected";
    case "CONNECTING":
      return "syncing";
    case "ERROR":
      return "disconnected";
    default:
      return "neutral";
  }
}

function buildLinePath(values: number[]): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, 1);
  const stepX = 320 / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = 56 - (value / max) * 48;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const TONE_WRAP: Record<OverviewBadgeTone, string> = {
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary text-on-secondary",
  neutral: "bg-surface-container-high text-on-surface-variant",
  success: "bg-tertiary-fixed text-on-tertiary-fixed",
  warning: "bg-error-container/60 text-on-error-container",
  danger: "bg-error-container text-on-error-container",
  outline: "bg-surface-container text-on-surface-variant",
};

export function OverviewScreen({ data }: { data: OverviewData }) {
  const { account, metrics, graphVersion } = data;
  const connected = account?.status === "CONNECTED";

  const health = [
    {
      label: "Quality Rating",
      value: account?.qualityRating ?? "—",
      icon: "check_circle",
      primary: Boolean(account?.qualityRating),
    },
    {
      label: "Messaging Tier",
      value: account?.messagingTier ?? "—",
      icon: "speed",
      primary: false,
    },
    {
      label: "Webhook Events",
      value: account ? formatNumber(account.processedEvents) : "0",
      icon: "swap_horiz",
      primary: false,
    },
    { label: "ChromaDB Sync", value: "Not configured", icon: "database", primary: false },
  ];

  const trafficLine = buildLinePath(data.traffic);
  const trafficArea = trafficLine ? `${trafficLine} L320,60 L0,60 Z` : "";

  const actions = [
    {
      label: "Live Inbox",
      hint: `${formatNumber(metrics.unread)} pending`,
      icon: "forum",
      wrap: "bg-primary text-on-primary",
      href: "/dashboard/inbox",
    },
    {
      label: "Upload PDF",
      hint: "Embed & train",
      icon: "upload_file",
      wrap: "bg-secondary-container text-on-secondary-container",
      href: "/dashboard/documents",
    },
    {
      label: "Contacts",
      hint: `${formatNumber(metrics.contacts)} profiles`,
      icon: "person_search",
      wrap: "bg-surface-container-highest text-on-surface",
      href: "/dashboard/contacts",
    },
    {
      label: "WhatsApp",
      hint: "Connection & webhook",
      icon: "monitor_heart",
      wrap: "bg-surface-container-highest text-primary",
      href: "/dashboard/whatsapp",
    },
  ];

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-high/80 p-space-sm text-on-surface shadow-sm">
        <div className="flex min-w-0 items-center gap-space-xs">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-container/20">
            <Icon
              name={connected ? "verified_user" : "link_off"}
              filled
              className={cn("text-[18px]", connected ? "text-primary" : "text-on-surface-variant")}
            />
          </span>
          <div className="flex min-w-0 flex-col">
            <span
              className={cn(
                "text-label-sm font-bold uppercase tracking-wider",
                connected ? "text-primary" : "text-on-surface-variant",
              )}
            >
              {connected ? "System Integrity Ok" : "WhatsApp Not Connected"}
            </span>
            <p className="truncate text-body-sm text-on-surface-variant">
              {connected
                ? `Webhook signature active · ${formatNumber(account?.processedEvents ?? 0)} events processed`
                : "Connect your Meta WhatsApp Cloud API to begin."}
            </p>
          </div>
        </div>
        <div className="ml-space-xs flex shrink-0 items-center gap-1">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "animate-pulse bg-primary" : "bg-outline",
            )}
          />
          <span className="text-[10px] font-semibold text-on-surface-variant">0 err</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-sm lg:grid-cols-2">
        <Card>
          <CardBody className="flex flex-col gap-space-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container/40 text-primary">
                  <Icon name="perm_phone_msg" className="text-[24px]" />
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="text-headline-sm text-on-surface">
                      {account?.name ?? "WhatsApp Account"}
                    </span>
                    <Badge tone="secondary">{graphVersion}</Badge>
                  </div>
                  <span className="text-body-sm text-on-surface-variant">
                    {account?.phoneNumber ?? "No number connected"}
                  </span>
                </div>
              </div>
              <StatusChip
                state={connectionState(account?.status)}
                label={connected ? "Live Stream" : undefined}
                pulse={connected}
              />
            </div>
            <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
              {health.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col rounded-lg bg-surface-container-low p-space-xs"
                >
                  <span className="text-label-sm text-on-surface-variant">{item.label}</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Icon
                      name={item.icon}
                      filled={item.primary}
                      className={cn(
                        "text-[16px]",
                        item.primary ? "text-primary" : "text-on-surface-variant",
                      )}
                    />
                    <span
                      className={cn(
                        "truncate text-headline-sm font-bold",
                        item.primary ? "text-primary" : "text-on-surface",
                      )}
                    >
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-space-sm">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-primary p-space-md text-on-primary shadow-sm">
            <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-semibold uppercase tracking-wider">Attention</span>
              <Icon name="mark_chat_unread" className="text-[20px]" />
            </div>
            <div className="my-space-xs">
              <div className="tnum text-display-sm font-bold tracking-tight">
                {formatNumber(metrics.unread)}
              </div>
              <p className="mt-0.5 text-body-sm leading-snug text-on-primary/90">
                Unread &amp; awaiting SLA dispatch
              </p>
            </div>
            <Link
              href="/dashboard/inbox"
              className="flex items-center gap-1 text-[11px] font-bold text-secondary-fixed"
            >
              <span>Open inbox</span>
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          </div>

          <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md text-on-surface shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Conversations
              </span>
              <Icon name="chat_bubble" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-xs">
              <div className="tnum text-display-sm font-bold tracking-tight">
                {formatNumber(metrics.conversations)}
              </div>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                <span className="font-semibold text-primary">{formatNumber(metrics.activeToday)}</span>{" "}
                active today
              </p>
            </div>
            <ProgressBar
              value={
                metrics.conversations > 0
                  ? Math.round((metrics.activeToday / metrics.conversations) * 100)
                  : 0
              }
            />
          </div>

          <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md text-on-surface shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Contacts
              </span>
              <Icon name="contacts" className="text-[20px] text-on-surface-variant" />
            </div>
            <div className="my-space-xs">
              <div className="tnum text-display-sm font-bold tracking-tight">
                {formatNumber(metrics.contacts)}
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <Icon name="group" className="text-[14px] text-primary" />
                <span className="text-body-sm font-semibold text-primary">In directory</span>
              </div>
            </div>
            <span className="text-[10px] text-on-surface-variant">PostgreSQL live</span>
          </div>

          <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md text-on-surface shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Indexed PDFs
              </span>
              <Icon name="picture_as_pdf" className="text-[20px] text-on-surface-variant" />
            </div>
            <div className="my-space-xs">
              <div className="tnum text-display-sm font-bold tracking-tight">
                {formatNumber(metrics.documents)} docs
              </div>
              <p className="mt-0.5 text-body-sm leading-tight text-on-surface-variant">
                <span className="tnum font-semibold text-on-surface">
                  {formatNumber(metrics.chunks)}
                </span>{" "}
                vector chunks
              </p>
            </div>
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant">
              ChromaDB off
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-space-xs">
        <span className="px-0.5 text-headline-sm text-on-surface">Quick Dispatch Actions</span>
        <div className="grid grid-cols-2 gap-space-xs lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-space-xs rounded-xl bg-surface-container p-space-sm text-left text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  action.wrap,
                )}
              >
                <Icon name={action.icon} className="text-[18px]" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-headline-sm">{action.label}</span>
                <span className="truncate text-label-sm text-on-surface-variant">{action.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2">
        <Card>
          <CardBody className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="hub" className="text-[20px] text-primary" />
                <span className="text-headline-sm text-on-surface">24h Inbound Traffic Pattern</span>
              </div>
              <span className="text-label-sm font-medium text-on-surface-variant">
                Avg {formatNumber(data.avgPerHour)} msg/h
              </span>
            </div>
            <div className="pt-space-xs">
              <svg
                className="h-16 w-full text-primary"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 320 60"
              >
                <defs>
                  <linearGradient id="gradEmerald" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00855d" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00855d" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {trafficArea ? <path d={trafficArea} fill="url(#gradEmerald)" /> : null}
                {trafficLine ? (
                  <path d={trafficLine} stroke="#006948" strokeLinecap="round" strokeWidth="2.5" />
                ) : null}
              </svg>
              {data.traffic.every((value) => value === 0) ? (
                <p className="pt-1 text-center text-[11px] text-on-surface-variant">
                  No messages in the last 24 hours.
                </p>
              ) : null}
              <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-on-surface-variant">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span className="font-bold text-primary">Now</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Active Inquiries"
            icon={<Icon name="inbox" className="text-[20px] text-primary" />}
            actions={
              <Link
                href="/dashboard/inbox"
                className="text-label-sm font-bold text-primary hover:underline"
              >
                View All
              </Link>
            }
          />
          <CardBody className="flex flex-col gap-space-xs">
            {data.inquiries.length === 0 ? (
              <p className="rounded-xl bg-surface-container-low p-space-md text-center text-body-sm text-on-surface-variant">
                No conversations yet. Inbound messages will appear here.
              </p>
            ) : (
              data.inquiries.map((row) => (
                <Link
                  key={row.id}
                  href={`/dashboard/inbox?c=${row.id}`}
                  className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-space-xs">
                      <span className="truncate text-headline-sm text-on-surface">{row.name}</span>
                      <Badge tone="secondary">{row.tag}</Badge>
                    </div>
                    <span className="shrink-0 text-label-sm text-on-surface-variant">{row.time}</span>
                  </div>
                  <p className="truncate text-body-sm font-medium text-on-surface">{row.preview}</p>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-on-surface-variant">{row.phone}</span>
                    {row.unread > 0 ? (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary">
                        {formatNumber(row.unread)} unread
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        Up to date
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent System Audit Log"
          icon={<Icon name="receipt_long" className="text-[20px] text-primary" />}
          actions={<span className="text-label-sm text-on-surface-variant">PostgreSQL Live</span>}
        />
        <CardBody>
          {data.audit.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              No activity recorded yet. Actions will be logged here.
            </p>
          ) : (
            <div className="relative space-y-space-md pl-space-md before:absolute before:bottom-2 before:left-2 before:top-2 before:w-[2px] before:bg-surface-container-high">
              {data.audit.map((entry) => (
                <div key={entry.id} className="relative flex flex-col gap-0.5">
                  <div
                    className={cn(
                      "absolute -left-[23px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-surface-container-lowest",
                      TONE_WRAP[entry.tone],
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-headline-sm text-on-surface">{entry.title}</span>
                    <span className="text-[11px] text-on-surface-variant">{entry.time}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">{entry.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm text-on-surface-variant">
        <div className="flex items-center gap-space-xs">
          <Icon name="cloud_done" className="text-[16px] text-primary" />
          <span className="text-[11px]">Meta Graph API: {graphVersion}</span>
        </div>
        <span className="text-[11px]">PostgreSQL connected</span>
      </div>
    </div>
  );
}
