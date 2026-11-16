import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-border-strong bg-surface px-1.5 font-mono text-[11px] leading-none text-muted",
        className,
      )}
      {...props}
    />
  );
}
