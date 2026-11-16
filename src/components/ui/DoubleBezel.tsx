import type { ComponentProps } from "react";
import { cn } from "./cn";

type Tag = "div" | "article" | "section" | "li";

interface DoubleBezelProps extends Omit<ComponentProps<"div">, "ref"> {
  /** sm : champs et petites cartes. md : cartes standards. lg : grands widgets. */
  size?: "sm" | "md" | "lg";
  /** card : posé sur le panneau. floating : flotte au-dessus du fond (landing, recherche). */
  elevation?: "card" | "floating";
  /** Hover doux, press et anneau de focus quand un enfant est focalisé. */
  interactive?: boolean;
  /** accent : très léger halo violet sur la surface interne, à réserver à un objet par écran. */
  tone?: "default" | "accent";
  as?: Tag;
  /** Classes de la surface interne (padding, disposition). */
  innerClassName?: string;
}

/**
 * Double bezel : coque externe (bordure, ombre), liseré, surface interne au rayon concentrique.
 * À réserver aux composants de premier niveau (widgets, recherche, aperçus) : jamais en cascade.
 */
export function DoubleBezel({
  size = "md",
  elevation = "card",
  interactive = false,
  tone = "default",
  as = "div",
  className,
  innerClassName,
  children,
  ...props
}: DoubleBezelProps) {
  const Tag = as as "div";
  return (
    <Tag
      data-size={size}
      data-elevation={elevation}
      data-tone={tone}
      data-interactive={interactive}
      className={cn("bezel", className)}
      {...props}
    >
      <div className={cn("bezel-inner", innerClassName)}>{children}</div>
    </Tag>
  );
}
