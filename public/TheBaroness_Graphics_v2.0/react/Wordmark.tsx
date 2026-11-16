import { Link } from "react-router";

/** Optionnel : remplace src/components/layout/Wordmark.tsx, préserve la signature du composant. */
export function Wordmark() {
  return (
    <Link
      to="/"
      aria-label="The Baroness, accueil"
      className="pressable inline-flex items-center gap-1.5 whitespace-nowrap rounded-md text-[19px] leading-none font-semibold tracking-[-0.045em] lowercase text-text"
    >
      <img src="/brand/logos/svg/mark-primary.svg" alt="" aria-hidden="true" width={26} height={26} className="h-[26px] w-[26px] shrink-0" />
      <span>the baroness.</span>
    </Link>
  );
}
