import type { DataMeta } from "@/api";
import { Alert } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

/** Fraîcheur et complétude des données (cahier 9.1). */
export function DataMetaNotice({ meta }: { meta: DataMeta }) {
  return (
    <div className="space-y-2">
      {meta.isStale && (
        <Alert tone="warning">
          Données potentiellement périmées : le service est indisponible, la dernière version connue
          est affichée.
        </Alert>
      )}
      {meta.isPartial && (
        <Alert tone="info">
          Données partielles : seules les parties disponibles sont prises en compte.
        </Alert>
      )}
      <p className="text-xs text-subtle">
        Collecté le {formatDateTime(meta.fetchedAt)}
        {meta.sourceUpdatedAt
          ? `, source mise à jour le ${formatDateTime(meta.sourceUpdatedAt)}`
          : ""}
      </p>
    </div>
  );
}
