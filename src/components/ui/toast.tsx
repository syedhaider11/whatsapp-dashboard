"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

type ToastTone = "default" | "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const ICONS: Record<ToastTone, string> = {
  default: "check_circle",
  success: "check_circle",
  error: "error",
};

const ICON_TONES: Record<ToastTone, string> = {
  default: "text-tertiary-fixed-dim",
  success: "text-tertiary-fixed-dim",
  error: "text-error-container",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "default") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="animate-fade-in flex items-center gap-1.5 rounded-full bg-inverse-surface px-space-md py-2 text-label-md text-inverse-on-surface shadow-lg"
          >
            <Icon name={ICONS[item.tone]} className={cn("text-[16px]", ICON_TONES[item.tone])} filled />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
