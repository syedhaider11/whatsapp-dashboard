import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function ProgressBar({
  value,
  tone = "primary",
  className,
  trackClassName,
}: {
  value: number;
  tone?: "primary" | "secondary" | "warning";
  className?: string;
  trackClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tones = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    warning: "bg-error",
  } as const;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high",
        trackClassName,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", tones[tone], className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-md shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-on-surface-variant">
        <span className="text-label-sm uppercase tracking-wider">{label}</span>
        {icon ? (
          <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
        ) : null}
      </div>
      <div className="mt-space-xs flex flex-col">
        <span className="tnum text-display-sm font-bold text-on-surface">{value}</span>
        {hint ? (
          <span className="text-body-sm text-on-surface-variant">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}
