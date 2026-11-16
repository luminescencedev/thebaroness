import { useState } from "react";
import { cn } from "@/components/ui";

interface RankBadgeProps {
  name: string | null | undefined;
  imageUrl?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** Affiche le nom à côté de l'icône. */
  label?: boolean;
  className?: string;
}

const sizes = { sm: "size-6", md: "size-10", lg: "size-16", xl: "size-28" };

/** Icône de rang du catalogue. Sans rang : texte « non classé », jamais une icône inventée. */
export function RankBadge({
  name,
  imageUrl,
  color,
  size = "md",
  label = false,
  className,
}: RankBadgeProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={label ? "" : (name ?? "Rang")}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("shrink-0 object-contain", sizes[size])}
        />
      ) : (
        <span
          aria-hidden="true"
          style={color ? { borderColor: color } : undefined}
          className={cn("shrink-0 rounded-full border-2 border-border-strong", sizes[size])}
        />
      )}
      {label && <span className="text-sm text-text">{name ?? "Non classé"}</span>}
    </span>
  );
}
