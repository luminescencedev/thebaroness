import { useState } from "react";
import { cn } from "@/components/ui";
import { initials } from "@/lib/format";

interface HeroPortraitProps {
  name: string;
  src: string | null | undefined;
  className?: string;
  /** Teinte de repli et de halo, hexadécimale. */
  color?: string;
  rounded?: "full" | "xl" | "lg";
}

/** Portrait de héros (image du catalogue) avec repli sur les initiales si l'image échoue. */
export function HeroPortrait({ name, src, className, color, rounded = "xl" }: HeroPortraitProps) {
  const [failed, setFailed] = useState(false);
  const radius =
    rounded === "full" ? "rounded-full" : rounded === "xl" ? "rounded-xl" : "rounded-lg";

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        style={color ? { backgroundColor: `${color}22`, color } : undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center border border-border-strong bg-surface-strong text-xs font-semibold text-muted",
          radius,
          className,
        )}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("shrink-0 bg-surface-strong object-cover", radius, className)}
    />
  );
}
