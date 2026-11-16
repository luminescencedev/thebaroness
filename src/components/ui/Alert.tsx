import type { ComponentProps } from "react";
import { cn } from "./cn";

type Tone = "info" | "warning" | "error";

const tones: Record<Tone, string> = {
  info: "border-border-strong bg-surface text-muted",
  warning: "border-warning/30 bg-warning/8 text-warning",
  error: "border-loss/30 bg-loss/8 text-loss",
};

export function Alert({
  tone = "info",
  className,
  ...props
}: ComponentProps<"div"> & { tone?: Tone }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-control border px-4 py-3 text-sm", tones[tone], className)}
      {...props}
    />
  );
}
