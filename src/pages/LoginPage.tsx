import { Navigate, useLocation, useSearchParams } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { Alert, Card } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";
import { useSession } from "@/features/auth/useSession";

export function LoginPage() {
  useDocumentTitle("Connexion");
  const session = useSession();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = (location.state as { from?: string } | null)?.from;

  if (session) return <Navigate to={from ?? "/tracked"} replace />;

  return (
    <Card className="mx-auto w-full max-w-md p-7 text-center">
      <h1 className="text-2xl">Connexion</h1>
      <p className="mt-2 text-sm text-muted">
        Connectez-vous avec votre compte Steam pour suivre des joueurs. Vous êtes redirigé vers
        Steam : The Baroness ne voit jamais votre mot de passe.
      </p>
      {params.get("error") && (
        <Alert tone="error" className="mt-5 text-left">
          La connexion avec Steam a échoué. Réessayez.
        </Alert>
      )}
      <SteamButton returnTo={from} className="mt-6 w-full" />
      <p className="mt-4 text-xs text-subtle">
        Nous utilisons seulement votre identifiant public Steam, votre pseudo et votre avatar.
      </p>
    </Card>
  );
}
