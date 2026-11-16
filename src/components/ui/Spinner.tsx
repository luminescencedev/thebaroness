import type { ComponentProps } from "react";
import { cn } from "./cn";

export function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      role="status"
      aria-label="Chargement"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("spinner size-4", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
