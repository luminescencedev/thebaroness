import { Link, useParams } from "react-router";
import { isApiError } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { Avatar, Button, EmptyState, Skeleton, Spinner, buttonStyles } from "@/components/ui";
import { MatchList } from "@/features/matches/MatchList";
import { StatsGrid } from "@/features/players/StatsGrid";
import { usePlayer, usePlayerMatches } from "@/features/players/hooks";
import { FollowButton } from "@/features/tracked-players/FollowButton";

function Matches({ steamId }: { steamId: string }) {
  const q = usePlayerMatches(steamId);

  if (q.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Chargement des parties">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 rounded-card" />
        ))}
      </div>
    );
  }
  if (!q.data) {
    return (
      <ErrorState
        error={q.error}
        title="Historique indisponible"
        onRetry={() => void q.refetch()}
      />
    );
  }
  const matches = q.data.pages.flatMap((p) => p.items);
  const meta = q.data.pages[0]?.meta;
  if (matches.length === 0) {
    return (
      <EmptyState
        title="Aucune partie disponible"
        description="Aucune partie n'est disponible pour ce joueur pour le moment."
      />
    );
  }
  return (
    <div className="space-y-4">
      <MatchList matches={matches} />
      {q.hasNextPage && (
        <div className="text-center">
          <Button
            variant="secondary"
            onClick={() => void q.fetchNextPage()}
            loading={q.isFetchingNextPage}
          >
            Charger plus
          </Button>
        </div>
      )}
      {q.isFetchNextPageError && <ErrorState error={q.error} title="Chargement impossible" />}
      {meta && <DataMetaNotice meta={meta} />}
    </div>
  );
}

export function PlayerPage() {
  const { steamId = "" } = useParams();
  const player = usePlayer(steamId);
  useDocumentTitle(player.data?.player.displayName ?? "Profil public");

  if (player.isPending) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Chargement du profil">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-card" />
        <span className="sr-only">
          <Spinner />
        </span>
      </div>
    );
  }

  if (player.isError) {
    if (isApiError(player.error) && player.error.status === 404) {
      return (
        <EmptyState
          title="Joueur introuvable"
          description="Aucun joueur ne correspond à cet identifiant."
          action={
            <Link to="/search" className={buttonStyles("secondary")}>
              Nouvelle recherche
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={player.error}
        title="Profil indisponible"
        onRetry={() => void player.refetch()}
      />
    );
  }

  const { player: p, stats, rank, meta } = player.data;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={p.displayName} src={p.avatarUrl} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl sm:text-4xl">{p.displayName}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="mono text-subtle">{p.steamId}</span>
            {p.region && <span>{p.region}</span>}
            <span>Rang : {rank.name ?? "non disponible"}</span>
          </p>
        </div>
        <FollowButton steamId={p.steamId} name={p.displayName} />
      </header>

      <section aria-labelledby="stats-titre" className="space-y-4">
        <h2 id="stats-titre" className="text-xl">
          Statistiques
        </h2>
        <StatsGrid stats={stats} />
        <DataMetaNotice meta={meta} />
      </section>

      <section aria-labelledby="parties-titre" className="space-y-4">
        <h2 id="parties-titre" className="text-xl">
          Parties disponibles
        </h2>
        <Matches steamId={p.steamId} />
      </section>
    </div>
  );
}
