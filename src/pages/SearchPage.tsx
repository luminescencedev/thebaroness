import { useSearchParams } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { usePalette } from "@/components/layout/paletteContext";
import { Button, EmptyState, Kbd, Skeleton } from "@/components/ui";
import { PlayerRow } from "@/features/players/PlayerRow";
import { usePlayerSearch } from "@/features/players/hooks";
import { timeAgo } from "@/lib/format";

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  useDocumentTitle(q ? `Recherche : ${q}` : "Recherche");
  const search = usePlayerSearch(q);
  const palette = usePalette();
  const count = search.data?.items.length ?? 0;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {search.data && (
            <span className="text-[13px] text-subtle">
              <span className="tabular-nums">{count}</span> joueur{count > 1 ? "s" : ""} · mis à
              jour {timeAgo(search.data.meta.fetchedAt)}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl">{q ? `Résultats pour « ${q} »` : "Recherche"}</h1>
        </div>
        <Button variant="secondary" onClick={palette.open}>
          {q ? "Modifier la recherche" : "Rechercher un joueur"} <Kbd aria-hidden="true">⌘K</Kbd>
        </Button>
      </div>

      <div aria-live="polite">
        {!q ? (
          <EmptyState
            icon="search"
            title="Lancez une recherche"
            description="Saisissez un pseudo Steam ou un SteamID64 à 17 chiffres."
            action={<Button onClick={palette.open}>Rechercher un joueur</Button>}
          />
        ) : search.isPending ? (
          <div
            className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]"
            aria-busy="true"
            aria-label="Chargement des résultats"
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[76px] rounded-card" />
            ))}
          </div>
        ) : search.isError ? (
          <ErrorState
            error={search.error}
            title="Recherche impossible"
            onRetry={() => void search.refetch()}
          />
        ) : count === 0 ? (
          <EmptyState
            icon="search"
            title={`Aucun joueur pour « ${q} »`}
            description="Vérifiez l'orthographe, ou collez un SteamID64 à 17 chiffres."
            action={<Button onClick={palette.open}>Modifier la recherche</Button>}
          />
        ) : (
          <div className="space-y-5">
            {count > 1 && (
              <div
                role="note"
                className="card flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] text-muted"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-text)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="size-4 shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                Plusieurs comptes ont un pseudo proche. Vérifiez le SteamID64 avant de suivre un
                joueur.
              </div>
            )}
            <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]">
              {search.data.items.map((p) => (
                <li key={p.steamId}>
                  <PlayerRow player={p} exact={p.displayName.toLowerCase() === q.toLowerCase()} />
                </li>
              ))}
            </ul>
            <DataMetaNotice meta={search.data.meta} onRetry={() => void search.refetch()} />
          </div>
        )}
      </div>
    </div>
  );
}
