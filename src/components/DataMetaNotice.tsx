import type { DataMeta } from "@/api";
import { Alert, Button } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

/** Fraîcheur et complétude des données (cahier 9.1). */
export function DataMetaNotice({
  meta,
  onRetry,
  showDate = true,
}: {
  meta: DataMeta;
  onRetry?: () => void;
  /** false quand la date de collecte est déjà affichée à côté (en-tête de profil). */
  showDate?: boolean;
}) {
  return (
    <div className="space-y-2">
      {meta.isStale && (
        <Alert tone="warning" className="flex items-center gap-3 !py-2.5">
          <span className="flex-1">
            Source lente. Données du {formatDateTime(meta.fetchedAt)}, affichées depuis le cache.
          </span>
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          )}
        </Alert>
      )}
      {meta.isPartial && (
        <Alert tone="info">
          Données partielles : seules les parties disponibles sont prises en compte.
        </Alert>
      )}
      {showDate && (
        <p className="text-xs text-subtle">
          Collecté le {formatDateTime(meta.fetchedAt)}
          {meta.sourceUpdatedAt
            ? `, source mise à jour le ${formatDateTime(meta.sourceUpdatedAt)}`
            : ""}
        </p>
      )}
    </div>
  );
}
