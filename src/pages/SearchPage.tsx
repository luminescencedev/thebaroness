import { useSearchParams } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Skeleton } from "@/components/ui";
import { PlayerRow } from "@/features/players/PlayerRow";
import { SearchForm } from "@/features/players/SearchForm";
import { usePlayerSearch } from "@/features/players/hooks";

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  useDocumentTitle(q ? `Recherche : ${q}` : "Recherche");
  const search = usePlayerSearch(q);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Recherche" description="Pseudo ou identifiant Steam (SteamID64)." />
      <SearchForm key={q} initial={q} />

      <div className="mt-8" aria-live="polite">
        {!q ? (
          <EmptyState
            title="Lancez une recherche"
            description="Saisissez un pseudo ou un identifiant Steam pour trouver un joueur."
          />
        ) : search.isPending ? (
          <div className="space-y-2" aria-busy="true" aria-label="Chargement des résultats">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-card" />
            ))}
          </div>
        ) : search.isError ? (
          <ErrorState
            error={search.error}
            title="Recherche impossible"
            onRetry={() => void search.refetch()}
          />
        ) : search.data.items.length === 0 ? (
          <EmptyState
            title="Aucun résultat"
            description={`Aucun joueur ne correspond à « ${q} ». Vérifiez l'orthographe ou essayez l'identifiant Steam.`}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {search.data.items.length} résultat{search.data.items.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-2">
              {search.data.items.map((p) => (
                <li key={p.steamId}>
                  <PlayerRow player={p} />
                </li>
              ))}
            </ul>
            <DataMetaNotice meta={search.data.meta} />
          </div>
        )}
      </div>
    </div>
  );
}
