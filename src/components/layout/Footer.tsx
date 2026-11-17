import { Link } from "react-router";

const link = "hover-text pressable rounded-md text-muted";

/** Pied de page du panneau : mention légale obligatoire et sources, sans bloc marketing. */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-divider pt-6 pb-2">
      <div className="flex flex-col gap-4 text-[12px] leading-relaxed text-subtle lg:flex-row lg:items-start lg:justify-between">
        <p className="max-w-3xl">
          Statistiques : Deadlock API, projet communautaire indépendant de Valve. The Baroness
          n&apos;est affilié ni à Valve ni aux organisations du jeu. Deadlock, ses héros, ses rangs
          et leurs visuels appartiennent à Valve Corporation.
        </p>
        <ul className="flex flex-none gap-5">
          <li>
            <a href="https://deadlock-api.com" target="_blank" rel="noreferrer" className={link}>
              Deadlock API
            </a>
          </li>
          <li>
            <Link to="/leaderboard" className={link}>
              Classement
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
