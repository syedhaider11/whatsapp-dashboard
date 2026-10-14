import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

const FIELD =
  "w-full rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  labelAccessory?: ReactNode;
  hint?: ReactNode;
  error?: string;
  leadingIcon?: string;
  trailing?: ReactNode;
};

export function Input({
  label,
  labelAccessory,
  hint,
  error,
  leadingIcon,
  trailing,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label
          htmlFor={id}
          className="flex items-center justify-between text-headline-sm text-on-surface"
        >
          <span>{label}</span>
          {labelAccessory}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {leadingIcon ? (
          <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-on-surface-variant">
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={id}
          className={cn(
            FIELD,
            "h-9",
            leadingIcon ? "pl-10" : "pl-3",
            trailing ? "pr-11" : "pr-3",
            error && "border-error focus:border-error focus:ring-error/20",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="absolute right-1.5">{trailing}</span>
        ) : null}
      </div>
      {error ? (
        <p className="text-body-sm text-error">{error}</p>
      ) : hint ? (
        <p className="text-body-sm text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(FIELD, "resize-none px-3 py-2 text-body-md", className)}
      {...props}
    />
  );
}
