import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = "md",
  online = false,
  className,
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-label-sm",
    md: "h-10 w-10 text-headline-sm",
    lg: "h-12 w-12 text-headline-md",
  } as const;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn("rounded-full object-cover", sizes[size])}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-primary font-semibold text-on-primary",
            sizes[size],
          )}
        >
          {initials}
        </span>
      )}
      {online ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
      ) : null}
    </span>
  );
}
