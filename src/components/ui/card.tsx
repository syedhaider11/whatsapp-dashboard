import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  icon,
  actions,
  className,
}: {
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-12 items-center justify-between gap-space-sm border-b border-outline-variant/40 bg-surface-container-low px-space-md",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-space-xs">
        {icon}
        <span className="truncate text-headline-sm text-on-surface">{title}</span>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-space-xs">{actions}</div>
      ) : null}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-space-md", className)} {...props}>
      {children}
    </div>
  );
}
