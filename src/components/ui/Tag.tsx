import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Tag({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface px-2.5 py-0.5 text-xs text-muted",
        className,
      )}
      {...props}
    />
  );
}
