import type { ReactNode } from "react";
import { steamLoginUrl } from "@/api";
import { buttonStyles, cn } from "@/components/ui";
import { saveReturnTo } from "./returnTo";

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-9.96 9.1l5.35 2.2a2.8 2.8 0 0 1 1.6-.5h.15l2.38-3.45v-.05a3.75 3.75 0 1 1 3.75 3.75h-.09l-3.4 2.43a2.8 2.8 0 0 1-5.55.45L2.3 14.3A10 10 0 1 0 12 2Zm-3.9 14.9-1.2-.5a2.1 2.1 0 1 0 1.2.5Zm7.5-4.8a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5Z" />
    </svg>
  );
}

interface SteamButtonProps {
  returnTo?: string;
  size?: "sm" | "md";
  className?: string;
  children?: ReactNode;
}

/** Lien (navigation complète vers le backend) qui ressemble à un bouton. */
export function SteamButton({
  returnTo,
  size = "md",
  className,
  children = "Se connecter avec Steam",
}: SteamButtonProps) {
  return (
    <a
      href={steamLoginUrl()}
      onClick={() => saveReturnTo(returnTo)}
      className={cn(buttonStyles("primary", size), className)}
    >
      <SteamIcon />
      {children}
    </a>
  );
}
