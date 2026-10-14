import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeTone =
  | "primary"
  | "secondary"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const TONES: Record<BadgeTone, string> = {
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container text-on-surface-variant",
  success: "bg-tertiary-fixed text-on-tertiary-fixed",
  warning: "bg-error-container/60 text-on-error-container",
  danger: "bg-error-container text-on-error-container",
  outline: "border border-outline-variant bg-surface-container-lowest text-on-surface-variant",
};

export type BadgeProps = {
  tone?: BadgeTone;
  pill?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = "neutral", pill = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-space-xs py-0.5 text-[10px] font-bold uppercase tracking-tight",
        pill ? "rounded-full" : "rounded",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type ConnectionState = "connected" | "syncing" | "disconnected" | "neutral";

const CONNECTION: Record<ConnectionState, { wrap: string; dot: string; label: string }> = {
  connected: {
    wrap: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
    dot: "bg-[#059669]",
    label: "Connected",
  },
  syncing: {
    wrap: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    dot: "bg-[#D97706]",
    label: "Syncing",
  },
  disconnected: {
    wrap: "bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]",
    dot: "bg-[#E11D48]",
    label: "Disconnected",
  },
  neutral: {
    wrap: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
    dot: "bg-[#475569]",
    label: "Suspended",
  },
};

export function StatusChip({
  state,
  label,
  pulse = false,
  className,
}: {
  state: ConnectionState;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  const tone = CONNECTION[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-space-sm py-1 text-label-sm font-bold tracking-wide",
        tone.wrap,
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse ? (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", tone.dot)} />
        ) : null}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", tone.dot)} />
      </span>
      {label ?? tone.label}
    </span>
  );
}
