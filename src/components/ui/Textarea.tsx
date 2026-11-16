import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Textarea({
  invalid = false,
  className,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 w-full resize-y rounded-control border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle transition-colors duration-150 disabled:opacity-50",
        invalid ? "border-loss/60" : "border-border-strong",
        className,
      )}
      {...props}
    />
  );
}
