import { Link, Navigate, useLocation, useSearchParams } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { Alert, DoubleBezel } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";
import { useSession } from "@/features/auth/useSession";

const POINTS = [
  ["Aucun mot de passe", "Steam vous identifie, nous ne voyons jamais vos identifiants."],
  ["Données publiques seulement", "Identifiant Steam, pseudo et avatar : rien d'autre."],
  ["Liste privée", "Vos suivis et vos groupes ne sont visibles que par vous."],
];

export function LoginPage() {
  useDocumentTitle("Connexion");
  const session = useSession();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = (location.state as { from?: string } | null)?.from;

  if (session) return <Navigate to={from ?? "/tracked"} replace />;

  return (
    <div className="relative isolate -mt-10 flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center py-20">
      <div aria-hidden="true" className="hero-glow absolute inset-x-0 top-0 -z-10 h-80" />
      <DoubleBezel size="lg" className="w-full max-w-md" innerClassName="p-8 text-center max-sm:p-6">
        <h1 className="text-3xl">Connexion</h1>
        <p className="mt-2 text-sm text-muted">
          Connectez-vous avec Steam pour suivre des joueurs et comparer vos amis.
        </p>
        {params.get("error") && (
          <Alert tone="error" className="mt-5 text-left" role="alert">
            La connexion avec Steam a échoué. Réessayez.
          </Alert>
        )}
        <SteamButton returnTo={from} className="mt-6 h-12 w-full text-base" />
        <ul className="mt-7 space-y-3.5 border-t border-border pt-6 text-left">
          {POINTS.map(([title, text]) => (
            <li key={title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-text"
              />
              <span className="text-[13px] text-muted">
                <span className="font-medium text-text">{title}.</span> {text}
              </span>
            </li>
          ))}
        </ul>
      </DoubleBezel>
      <Link
        to="/search"
        className="hover-text pressable mt-6 rounded-md text-sm text-muted underline-offset-4 hover:underline"
      >
        Continuer sans compte
        <span aria-hidden="true"> →</span>
      </Link>
    </div>
  );
}
