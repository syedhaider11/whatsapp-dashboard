"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "center" | "bottom";
  className?: string;
  scrimClassName?: string;
};

export function Modal({
  open,
  onClose,
  children,
  align = "center",
  className,
  scrimClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-inverse-surface/50 p-space-md backdrop-blur-sm",
        align === "center" ? "items-center" : "items-end sm:items-center",
        scrimClassName,
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "animate-fade-in w-full max-w-sm rounded-2xl bg-surface-container-lowest shadow-xl",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
