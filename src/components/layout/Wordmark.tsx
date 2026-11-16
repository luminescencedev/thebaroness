import { Link } from "react-router";

export function Wordmark() {
  return (
    <Link
      to="/"
      aria-label="The Baroness, accueil"
      className="pressable inline-block rounded-md text-[19px] leading-none font-semibold tracking-[-0.045em] lowercase text-text"
    >
      the baroness<span className="text-focus">.</span>
    </Link>
  );
}
