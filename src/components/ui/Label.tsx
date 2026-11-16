import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("block text-[13px] font-medium text-muted", className)} {...props} />;
}
