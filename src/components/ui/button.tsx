import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost"
  | "icon";

type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-container shadow-sm focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  secondary:
    "bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
  destructive:
    "bg-surface-container-lowest text-error border border-error-container hover:bg-error-container/40 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  icon:
    "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-space-sm gap-1 text-label-sm rounded-lg",
  md: "h-9 px-space-md gap-1.5 text-headline-sm rounded-lg",
  lg: "h-11 px-space-lg gap-2 text-headline-sm rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const isIcon = variant === "icon";

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
        isIcon
          ? "h-8 w-8 shrink-0 rounded-lg"
          : SIZES[size],
        VARIANTS[variant],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
