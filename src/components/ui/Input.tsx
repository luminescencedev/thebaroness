import type { ComponentProps } from "react";
import { cn } from "./cn";

export interface InputProps extends ComponentProps<"input"> {
  invalid?: boolean;
}

/** Associer un Label via htmlFor/id, et un message d'erreur via aria-describedby. */
export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-control border bg-surface px-3 text-sm text-text placeholder:text-subtle transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        invalid ? "border-loss/60" : "border-border-strong",
        className,
      )}
      {...props}
    />
  );
}
