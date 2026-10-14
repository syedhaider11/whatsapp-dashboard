import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

export type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  weight?: number;
  label?: string;
  style?: CSSProperties;
};

export function Icon({
  name,
  className,
  filled = false,
  weight = 400,
  label,
  style,
}: IconProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
