import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Button, buttonStyles } from "@/components/ui";

/** Filet de sécurité : une page qui plante n'affiche jamais d'écran blanc ni de trace technique. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-center">
      <div className="card flex max-w-md flex-col items-center gap-3 px-8 py-12">
        <p aria-hidden="true" className="text-5xl font-semibold tracking-[-0.045em] text-muted">
          {notFound ? "404" : "Oups"}
        </p>
        <h1 className="text-xl">
          {notFound ? "Page introuvable" : "Quelque chose s'est mal passé"}
        </h1>
        <p className="text-sm text-muted">
          {notFound
            ? "Cette page n'existe pas."
            : "Une erreur inattendue est survenue. Vos données ne sont pas perdues."}
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Recharger
          </Button>
          <Link to="/" className={buttonStyles("primary")}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
