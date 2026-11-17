import type { ComponentProps } from "react";
import { cn } from "./cn";

export interface IconButtonProps extends Omit<ComponentProps<"button">, "aria-label"> {
  /** Obligatoire : un bouton icône n'a pas de texte visible. */
  label: string;
  size?: "sm" | "md";
}

/** Bouton carré à icône seule : press 0,97, survol en couleur uniquement (pointeur précis). */
export function IconButton({
  label,
  size = "md",
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "pressable icon-btn grid cursor-pointer place-items-center rounded-[10px] text-muted disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "size-8" : "size-9",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
