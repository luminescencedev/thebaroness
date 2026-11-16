import { Link } from "react-router";
import { useSession } from "@/features/auth/useSession";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const session = useSession();
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-2xl text-[13px] leading-relaxed text-subtle">
            Statistiques : Deadlock API, projet communautaire indépendant de Valve. The Baroness
            n&apos;est affilié ni à Valve ni aux organisations du jeu.
          </p>
        </div>
        <nav aria-label="Pied de page" className="flex gap-6 text-sm text-muted">
          <Link to="/search" className="hover-text pressable rounded-md">
            Joueurs
          </Link>
          {session ? (
            <Link to="/tracked" className="hover-text pressable rounded-md">
              Mes suivis
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover-text pressable rounded-md">
                Connexion
              </Link>
              <Link to="/register" className="hover-text pressable rounded-md">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}
