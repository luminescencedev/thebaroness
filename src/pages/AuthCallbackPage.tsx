import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { completeSteamLogin } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import { BrandLoader } from "@/components/brand";
import { buttonStyles } from "@/components/ui";
import { takeReturnTo } from "@/features/auth/returnTo";

/** Retour de Steam : le backend redirige ici avec #token=<JWT> ou ?error=<code>. */
export function AuthCallbackPage() {
  useDocumentTitle("Connexion");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [failure, setFailure] = useState<unknown>(params.get("error") ? new Error("steam") : null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || params.get("error")) return;
    started.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    (token ? completeSteamLogin(token) : Promise.reject(new Error("no-token"))).then(
      () => void navigate(takeReturnTo() ?? "/tracked", { replace: true }),
      (error: unknown) => setFailure(error),
    );
  }, [navigate, params]);

  if (failure) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <ErrorState error={failure} title="Connexion impossible" />
        <Link to="/login" className={buttonStyles("secondary")}>
          Retour à la connexion
        </Link>
      </div>
    );
  }
  return <BrandLoader message="Connexion avec Steam en cours" />;
}
