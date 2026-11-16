import { useState } from "react";
import { initials } from "@/lib/format";
import { cn } from "./cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

/** Avatar Steam, ou initiales quand avatarUrl est null ou que l'image ne charge pas. */
export function Avatar({ name, src, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn("size-10 shrink-0 rounded-full bg-surface-strong object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-strong text-sm font-semibold text-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
