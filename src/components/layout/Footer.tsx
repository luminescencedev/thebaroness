import { Link } from "react-router";
import { useSession } from "@/features/auth/useSession";
import { Medallion } from "@/components/brand";

const col = "space-y-2.5 text-sm";
const link = "hover-text pressable inline-block rounded-md text-muted";

export function Footer() {
  const session = useSession();
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2">
            <Medallion size={26} />
            <span className="text-[19px] leading-none font-semibold tracking-[-0.045em] lowercase">
              the baroness.
            </span>
          </span>
          <p className="max-w-sm text-[13px] leading-relaxed text-subtle">
            Les statistiques de joueurs et de héros Deadlock, lisibles, avec un espace privé pour
            suivre les joueurs qui comptent.
          </p>
        </div>

        <nav aria-label="Explorer" className={col}>
          <p className="text-xs font-medium tracking-[0.12em] text-subtle uppercase">Explorer</p>
          <ul className="space-y-2.5">
            <li>
              <Link to="/search" className={link}>
                Joueurs
              </Link>
            </li>
            <li>
              <Link to="/heroes" className={link}>
                Héros
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" className={link}>
                Classement
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Compte" className={col}>
          <p className="text-xs font-medium tracking-[0.12em] text-subtle uppercase">Compte</p>
          <ul className="space-y-2.5">
            {session ? (
              <li>
                <Link to="/tracked" className={link}>
                  Mes suivis
                </Link>
              </li>
            ) : (
              <li>
                <Link to="/login" className={link}>
                  Connexion Steam
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className={col}>
          <p className="text-xs font-medium tracking-[0.12em] text-subtle uppercase">Sources</p>
          <ul className="space-y-2.5">
            <li>
              <a href="https://deadlock-api.com" target="_blank" rel="noreferrer" className={link}>
                Deadlock API
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-6 text-[12px] leading-relaxed text-subtle sm:px-6">
          Statistiques : Deadlock API, projet communautaire indépendant de Valve. The Baroness
          n&apos;est affilié ni à Valve ni aux organisations du jeu. Deadlock, ses héros, ses rangs
          et leurs visuels appartiennent à Valve Corporation.
        </p>
      </div>
    </footer>
  );
}
