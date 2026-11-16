import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  primary: "btn-primary bg-text text-[#0a0b0d] border border-transparent",
  secondary: "btn-secondary bg-surface-strong text-text border border-border-strong",
  ghost: "btn-ghost bg-transparent text-muted border border-transparent",
  danger: "btn-danger bg-loss/12 text-loss border border-loss/30",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

/** Classes d'un bouton, réutilisables pour un lien qui ressemble à un bouton. */
export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cn(
    "pressable inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
  );
}
