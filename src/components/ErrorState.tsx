import type { ReactNode } from "react";
import { isApiError } from "@/api";
import { Button, EmptyState } from "@/components/ui";
import { errorMessage } from "@/lib/messages";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  /** Actions supplémentaires (par exemple un lien vers Mes suivis). */
  extra?: ReactNode;
  /** Remplace le message générique (par exemple pour un retour d'authentification). */
  description?: ReactNode;
  /** false quand la ressource en échec est justement celle des suivis : pas de rappel « restent accessibles ». */
  reassure?: boolean;
}

/** État d'erreur réseau, 503, 429, 500 : message clair, jamais de détail technique. */
export function ErrorState({
  error,
  title = "Chargement impossible",
  onRetry,
  extra,
  description,
  reassure = true,
}: ErrorStateProps) {
  const unavailable = isApiError(error) && [502, 503].includes(error.status);
  return (
    <div role="alert">
      <EmptyState
        icon="alert"
        title={title}
        description={
          <>
            {description ?? errorMessage(error)}
            {!description && reassure && unavailable && " Vos suivis restent accessibles."}
          </>
        }
        action={
          extra || onRetry ? (
            <>
              {extra}
              {onRetry && <Button onClick={onRetry}>Réessayer</Button>}
            </>
          ) : undefined
        }
      />
    </div>
  );
}
