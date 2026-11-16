import { Link } from "react-router";
import { BrandMark } from "@/components/brand";

/** Marque animée + « the baroness. » (Geist 600, -4,5 %, minuscules). */
export function Wordmark({ animated = true }: { animated?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="The Baroness, accueil"
      className="pressable inline-flex items-center gap-2 rounded-md whitespace-nowrap"
    >
      {animated && <BrandMark size={34} />}
      <span className="text-[19px] leading-none font-semibold tracking-[-0.045em] text-text lowercase">
        the baroness.
      </span>
    </Link>
  );
}
