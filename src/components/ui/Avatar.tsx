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
  // cn() ne fusionne pas les utilitaires : la taille par défaut cède si l'appelant en fournit une.
  const base = className?.includes("size-") ? "" : "size-10";
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(base, "shrink-0 rounded-full bg-surface-strong object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        base,
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-strong text-sm font-semibold text-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
