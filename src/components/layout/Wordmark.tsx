import { Link } from "react-router";
import { Emblem } from "@/components/brand/Emblem";

/** Emblème + « The Baroness » (Geist 700, -4,5 %) ; `iconOnly` pour le header de la landing. */
export function Wordmark({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="The Baroness, accueil"
      className="pressable inline-flex items-center gap-2.5 rounded-md whitespace-nowrap"
    >
      <Emblem size={iconOnly ? 40 : 32} aria-hidden="true" />
      <span
        hidden={iconOnly}
        className="text-[19px] leading-none font-bold tracking-[-0.045em] text-text"
      >
        The Baroness
      </span>
    </Link>
  );
}
