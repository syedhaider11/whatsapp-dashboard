"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, Icon, Input, Modal, StatusChip, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/components/ui";
import {
  connectWhatsAppAccount,
  disconnectWhatsAppAccount,
  testWhatsAppCredentials,
} from "@/app/dashboard/whatsapp/actions";

export type WhatsAppAccountView = {
  id: string;
  name: string;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  status: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR";
  qualityRating: string | null;
  messagingTier: string | null;
  processedEvents: number;
  lastError: string | null;
};

const STATUS_MAP: Record<WhatsAppAccountView["status"], { state: ConnectionState; label: string }> = {
  CONNECTED: { state: "connected", label: "Connected" },
  CONNECTING: { state: "syncing", label: "Connecting" },
  DISCONNECTED: { state: "disconnected", label: "Disconnected" },
  ERROR: { state: "disconnected", label: "Error" },
};

function CopyButton({ value }: { value: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      title="Copy"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        toast("Copied to clipboard");
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-colors hover:text-primary"
    >
      <Icon name="content_copy" className="text-[18px]" />
    </button>
  );
}

function KeyRow({
  label,
  value,
  badge,
  copy,
}: {
  label: string;
  value: string;
  badge?: string;
  copy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-container p-space-sm">
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className="truncate text-body-sm font-semibold text-on-surface">{value}</span>
      </div>
      {copy ? (
        <CopyButton value={value} />
      ) : badge ? (
        <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-label-sm font-semibold text-on-surface">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function WhatsAppConsole({
  account,
  canConnect,
  canDisconnect,
}: {
  account: WhatsAppAccountView | null;
  canConnect: boolean;
  canDisconnect: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [handshake, setHandshake] = useState<{ ok: boolean; text: string } | null>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const status = account ? STATUS_MAP[account.status] : { state: "disconnected" as ConnectionState, label: "Not Connected" };
  const isConnected = account?.status === "CONNECTED";

  async function runHandshake() {
    if (!formRef.current) return;
    setTesting(true);
    setHandshake(null);
    const result = await testWhatsAppCredentials(new FormData(formRef.current));
    setTesting(false);
    setHandshake({ ok: result.ok, text: result.message });
  }

  async function saveConfiguration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setHandshake(null);
    const result = await connectWhatsAppAccount(new FormData(formRef.current));
    setSaving(false);
    setHandshake({ ok: result.ok, text: result.message });
    toast(result.message, result.ok ? "success" : "error");
    if (result.ok) router.refresh();
  }

  async function confirmDisconnect() {
    setDisconnecting(true);
    const result = await disconnectWhatsAppAccount();
    setDisconnecting(false);
    setDisconnectOpen(false);
    setHandshake({ ok: false, text: result.message });
    toast(result.message, result.ok ? "success" : "error");
    if (result.ok) router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-space-md">
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-space-sm py-0.5 text-label-sm text-on-secondary-container shadow-sm">
            <Icon name="verified" className="text-[14px]" />
            Meta for Developers Cloud API Integration
          </span>
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            <Icon name="security" className="text-[14px] text-primary" />
            v20.0 Core
          </span>
        </div>
        <div className="flex items-start gap-space-sm rounded-xl bg-surface-container p-space-md shadow-sm">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
            <Icon name="policy" className="text-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-headline-sm leading-snug text-on-surface">Enterprise Protocol Standard</span>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Connect your business account using official Meta credentials. QR-code scanning and
              WhatsApp Web pairing are explicitly not supported for enterprise compliance.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Live Connection Profile"
          icon={<Icon name="hub" className="text-[20px] text-primary" />}
          actions={<StatusChip state={status.state} label={status.label} pulse={isConnected} />}
        />
        <CardBody className="flex flex-col gap-space-md">
          {account ? (
            <>
              <div className="flex items-center gap-space-md rounded-lg bg-surface-container-low p-space-sm">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
                  <Icon name="phone_iphone" className="text-[28px]" />
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <Icon name={isConnected ? "check" : "priority_high"} className="text-[11px]" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-headline-md text-on-surface">{account.name}</span>
                    <Icon name="verified" className="shrink-0 text-[16px] text-primary" />
                  </div>
                  <span className="text-body-md font-semibold text-on-surface-variant">{account.phoneNumber}</span>
                  <span className="text-[11px] text-primary">Official WhatsApp Business Account</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <KeyRow label="Phone Number ID" value={account.phoneNumberId} copy />
                <KeyRow label="WABA Account ID" value={account.wabaId} copy />
                <KeyRow label="Meta API Engine" value="v20.0 Graph API" badge="LTS Tier" />
                {account.qualityRating ? (
                  <KeyRow label="Quality Rating" value={account.qualityRating} />
                ) : null}
                <div className="flex flex-col gap-1.5 rounded-lg bg-surface-container p-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
                      Meta Webhook Ingress
                    </span>
                    <span className="flex items-center gap-1 text-label-sm font-bold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {isConnected ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="select-all break-all rounded bg-surface-container-lowest p-space-xs text-[11px] text-on-surface-variant">
                    /api/webhooks/whatsapp
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                      <Icon name="sync_alt" className="text-[14px] text-secondary" />
                      Processed Events
                    </span>
                    <span className="tnum text-label-sm font-bold text-on-surface">
                      {account.processedEvents.toLocaleString()} events
                    </span>
                  </div>
                </div>
                {account.lastError ? (
                  <div className="flex items-start gap-1.5 rounded-lg bg-error-container/40 p-space-sm text-body-sm text-on-error-container">
                    <Icon name="error" className="mt-0.5 shrink-0 text-[16px]" />
                    <span>{account.lastError}</span>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-space-md rounded-lg bg-surface-container-low p-space-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
                <Icon name="phonelink_erase" className="text-[26px]" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-headline-md text-on-surface">No account connected</span>
                <span className="text-body-sm text-on-surface-variant">
                  Provide your Meta Cloud API credentials below to establish a session.
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Credential Configuration"
          icon={<Icon name="key_vertical" className="text-[20px] text-primary" />}
          actions={<Badge tone="secondary">Cloud API v20</Badge>}
        />
        <CardBody>
          <form ref={formRef} className="flex flex-col gap-space-md" onSubmit={saveConfiguration}>
            <Input
              id="waba-phone"
              name="phoneNumber"
              label="WhatsApp Business Phone"
              labelAccessory={<span className="text-label-sm font-medium text-primary">E.164 Format</span>}
              leadingIcon="call"
              type="tel"
              defaultValue={account?.phoneNumber ?? ""}
              placeholder="+1 (555) 000-0000"
              required
            />
            <Input
              id="waba-phone-id"
              name="phoneNumberId"
              label="Phone Number ID"
              leadingIcon="badge"
              defaultValue={account?.phoneNumberId ?? ""}
              placeholder="109283746592019"
              required
            />
            <Input
              id="waba-account-id"
              name="wabaId"
              label="WhatsApp Business Account ID (WABA ID)"
              leadingIcon="domain"
              defaultValue={account?.wabaId ?? ""}
              placeholder="392847501928374"
              required
            />
            <Input
              id="waba-token"
              name="accessToken"
              label="Permanent System User Token"
              labelAccessory={
                <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary">
                  <Icon name="lock" className="text-[13px]" /> Vault Sealed
                </span>
              }
              leadingIcon="password"
              type={tokenVisible ? "text" : "password"}
              placeholder={isConnected ? "•••••••••••• stored server-side" : "EAAG…"}
              autoComplete="off"
              required
              trailing={
                <button
                  type="button"
                  aria-label="Toggle token display"
                  onClick={() => setTokenVisible((visible) => !visible)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:text-on-surface"
                >
                  <Icon name={tokenVisible ? "visibility_off" : "visibility"} className="text-[20px]" />
                </button>
              }
              hint={
                <span className="flex items-start gap-1 leading-normal">
                  <Icon name="verified_user" className="mt-0.5 shrink-0 text-[14px] text-primary" />
                  <span>Tokens are securely stored in server-side vault. Never exposed in browser response.</span>
                </span>
              }
            />

            {handshake ? (
              <div className="flex items-center gap-2 rounded-lg bg-surface-container p-space-sm">
                <Icon
                  name={handshake.ok ? "check_circle" : "error"}
                  className={cn("text-[18px]", handshake.ok ? "text-primary" : "text-error")}
                />
                <span className="text-label-sm text-on-surface">{handshake.text}</span>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 pt-space-xs">
              <Button
                variant="secondary"
                size="lg"
                onClick={runHandshake}
                disabled={testing || saving || !canConnect}
              >
                <Icon
                  name={testing ? "autorenew" : "network_check"}
                  className={cn("text-[18px] text-primary", testing && "animate-spin")}
                />
                <span>{testing ? "Testing Meta Graph Handshake..." : "Validate & Test Meta Handshake"}</span>
              </Button>
              <Button type="submit" size="lg" disabled={saving || testing || !canConnect}>
                <Icon name={saving ? "autorenew" : "save"} className={cn("text-[18px]", saving && "animate-spin")} />
                <span>{saving ? "Validating & Saving..." : "Save Configuration"}</span>
              </Button>
              {!canConnect ? (
                <p className="text-center text-[11px] text-on-surface-variant">
                  Your role does not permit connecting WhatsApp accounts.
                </p>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-space-sm rounded-xl bg-error-container/25 p-space-md shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error-container text-error">
            <Icon name="link_off" className="text-[20px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-headline-sm text-on-surface">Disconnect WhatsApp Integration</span>
            <span className="text-[11px] font-semibold text-error">Irreversible Session Interruption</span>
          </div>
        </div>
        <div className="rounded-lg bg-surface-container-lowest p-space-sm">
          <p className="text-body-sm leading-relaxed text-on-surface-variant">
            Disconnecting will stop incoming webhooks and message transmission immediately. It will{" "}
            <strong className="font-semibold text-on-surface">NOT</strong> delete your Meta WhatsApp Business
            account or historical campaign records.
          </p>
        </div>
        <Button
          variant="destructive"
          size="lg"
          className="mt-1"
          disabled={!isConnected || !canDisconnect}
          onClick={() => setDisconnectOpen(true)}
        >
          <Icon name="power_settings_new" className="text-[18px]" />
          Disconnect WhatsApp
        </Button>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-xl bg-surface-container p-space-sm text-center shadow-sm">
        <div className="flex items-center gap-1.5 text-primary">
          <Icon name="lock_clock" className="text-[16px]" />
          <span className="text-label-sm font-bold uppercase tracking-wider">Zero Client Secret Exposure</span>
        </div>
        <p className="text-[11px] text-on-surface-variant">
          PostgreSQL Server-side Encryption (AES-GCM-256) • RBAC Protected
        </p>
      </div>

      <Modal open={disconnectOpen} onClose={() => setDisconnectOpen(false)} className="max-w-sm">
        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
              <Icon name="warning" className="text-[28px]" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-headline-lg text-on-surface">Confirm Disconnect</span>
              <span className="text-label-sm text-on-surface-variant">{account?.phoneNumber}</span>
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-low p-space-sm text-body-sm leading-relaxed text-on-surface-variant">
            This action revokes webhook consumption and ceases live routing. To restore messaging operations,
            an authorized admin must re-authenticate with Meta Cloud credentials.
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="bg-error text-on-error hover:bg-error/90"
              disabled={disconnecting}
              onClick={confirmDisconnect}
            >
              <Icon name={disconnecting ? "autorenew" : "link_off"} className={cn("text-[18px]", disconnecting && "animate-spin")} />
              {disconnecting ? "Terminating Session..." : "Confirm & Terminate Session"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setDisconnectOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
