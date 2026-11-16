import { Button, EmptyState } from "@/components/ui";
import { errorMessage } from "@/lib/messages";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

/** État d'erreur réseau, 503, 429, 500 : message clair, jamais de détail technique. */
export function ErrorState({ error, title = "Chargement impossible", onRetry }: ErrorStateProps) {
  return (
    <div role="alert">
      <EmptyState
        title={title}
        description={errorMessage(error)}
        action={
          onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Réessayer
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
