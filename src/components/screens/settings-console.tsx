"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, Icon, Input, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { updateSystemSettings } from "@/app/dashboard/settings/actions";

export type ConfigRow = {
  label: string;
  value: string;
  icon: string;
  configured: boolean;
};

export type AccountSettings = {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
  qualityRating: string | null;
  messagingTier: string | null;
  webhookUrl: string | null;
  graphVersion: string;
  processedEvents: number;
  connectedByLabel: string | null;
};

export function SettingsConsole({
  account,
  serverConfig,
}: {
  account: AccountSettings | null;
  serverConfig: ConfigRow[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const connected = account?.status === "CONNECTED";

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSystemSettings(formData);
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-space-md">
      <Card>
        <CardHeader
          title="WhatsApp Business Account"
          icon={<Icon name="phone_in_talk" className="text-[20px] text-primary" />}
          actions={
            <Badge tone={connected ? "success" : "danger"}>{account?.status ?? "NOT CONFIGURED"}</Badge>
          }
        />
        <CardBody className="flex flex-col gap-space-md">
          {account ? (
            <>
              <div className="grid grid-cols-2 gap-space-xs lg:grid-cols-4">
                {[
                  { label: "Display Phone", value: account.phoneNumber },
                  { label: "Quality", value: account.qualityRating ?? "Unknown" },
                  { label: "Messaging Tier", value: account.messagingTier ?? "Default" },
                  { label: "Webhook Events", value: String(account.processedEvents) },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col rounded-lg bg-surface-container-low p-space-xs">
                    <span className="text-label-sm text-on-surface-variant">{stat.label}</span>
                    <span className="tnum text-headline-sm font-bold text-on-surface">{stat.value}</span>
                  </div>
                ))}
              </div>

              <form action={submit} className="flex flex-col gap-space-sm">
                <Input label="Account label" name="name" defaultValue={account.name} required />
                <Input
                  label="Webhook URL"
                  name="webhookUrl"
                  defaultValue={account.webhookUrl ?? ""}
                  placeholder="https://your-domain.com/api/webhooks/whatsapp"
                />
                <Input
                  label="Messaging tier"
                  name="messagingTier"
                  defaultValue={account.messagingTier ?? ""}
                  placeholder="100K / day"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-on-surface-variant">
                    Connected by {account.connectedByLabel ?? "System"} · Graph {account.graphVersion}
                  </span>
                  <Button type="submit" disabled={pending}>
                    <Icon name="save" className="text-[18px]" />
                    {pending ? "Saving..." : "Save settings"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-space-md text-center">
              <Icon name="link_off" className="text-[36px] text-on-surface-variant" />
              <p className="text-body-sm text-on-surface-variant">
                Connect a WhatsApp Business number from the WhatsApp screen first.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Server Configuration"
          icon={<Icon name="dns" className="text-[20px] text-primary" />}
          actions={<span className="text-label-sm text-on-surface-variant">Environment</span>}
        />
        <CardBody className="grid grid-cols-1 gap-space-xs lg:grid-cols-2">
          {serverConfig.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-sm"
            >
              <div className="flex min-w-0 items-center gap-space-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant">
                  <Icon name={row.icon} className="text-[18px]" />
                </span>
                <span className="truncate text-body-sm text-on-surface">{row.label}</span>
              </div>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="max-w-[160px] truncate font-mono text-[11px] text-on-surface-variant">
                  {row.value}
                </span>
                <Icon
                  name={row.configured ? "check_circle" : "error"}
                  filled
                  className={cn("text-[16px]", row.configured ? "text-primary" : "text-error")}
                />
              </span>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm text-on-surface-variant">
        <div className="flex items-center gap-space-xs">
          <Icon name="security" className="text-[16px] text-primary" />
          <span className="text-[11px]">
            Secrets are stored server-side only and never exposed to the browser.
          </span>
        </div>
      </div>
    </div>
  );
}
