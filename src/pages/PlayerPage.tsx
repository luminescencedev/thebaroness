import { Link, useParams } from "react-router";
import { isApiError, type MatchSummary } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BarList, LineChart } from "@/components/charts";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import { Avatar, Button, Card, EmptyState, Skeleton, buttonStyles } from "@/components/ui";
import { usePlayerHeroes } from "@/features/leaderboard/hooks";
import { MatchList } from "@/features/matches/MatchList";
import { FormStrip } from "@/features/players/FormStrip";
import { StatsGrid } from "@/features/players/StatsGrid";
import { usePlayer, usePlayerMatches } from "@/features/players/hooks";
import { FollowButton } from "@/features/tracked-players/FollowButton";
import { formatDate, formatDecimal, formatPercent, formatRegion } from "@/lib/format";

/** Taux de victoire cumulé, du plus ancien au plus récent, sur les parties chargées. */
function cumulativeWinRate(matches: MatchSummary[]) {
  const ordered = [...matches].reverse();
  let wins = 0;
  return ordered.map((m, i) => {
    if (m.outcome === "win") wins += 1;
    return { label: formatDate(m.playedAt), value: Math.round((wins / (i + 1)) * 1000) / 10 };
  });
}

function kdaPerMatch(matches: MatchSummary[]) {
  return [...matches]
    .reverse()
    .filter((m) => m.kills !== null && m.assists !== null && m.deaths !== null)
    .map((m) => ({
      label: formatDate(m.playedAt),
      value:
        Math.round((((m.kills ?? 0) + (m.assists ?? 0)) / Math.max(1, m.deaths ?? 1)) * 100) / 100,
    }));
}

function HeroBreakdown({ steamId }: { steamId: string }) {
  const q = usePlayerHeroes(steamId);
  if (q.isPending) return <Skeleton className="h-40 rounded-card" />;
  if (q.isError)
    return (
      <ErrorState error={q.error} title="Héros indisponibles" onRetry={() => void q.refetch()} />
    );
  if (q.data.items.length === 0) {
    return (
      <EmptyState
        title="Aucun héros"
        description="Aucune partie disponible pour établir les héros joués."
      />
    );
  }
  const top = q.data.items.slice(0, 8);
  return (
    <Card>
      <BarList
        items={top.map((h) => ({
          key: String(h.heroId),
          value: h.matches,
          display: `${h.matches} parties`,
          label: (
            <>
              <HeroPortrait
                name={h.heroName}
                src={h.heroImageUrl}
                rounded="full"
                className="size-7"
              />
              <Link to={`/heroes/${h.heroId}`} className="truncate hover:underline">
                {h.heroName}
              </Link>
            </>
          ),
        }))}
      />
      <p className="mt-4 text-xs text-subtle">
        Taux de victoire :{" "}
        {top
          .map((h) => `${h.heroName} ${formatPercent(h.winRate)}`)
          .slice(0, 3)
          .join(", ")}
        {top.length > 3 ? "…" : ""}
      </p>
    </Card>
  );
}

function Matches({ steamId }: { steamId: string }) {
  const q = usePlayerMatches(steamId);

  if (q.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Chargement des parties">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-card" />
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
  const winRates = cumulativeWinRate(matches);
  const kdas = kdaPerMatch(matches);

  return (
    <div className="space-y-10">
      <section aria-labelledby="forme" className="space-y-3">
        <h2 id="forme" className="text-xl">
          Forme récente
        </h2>
        <FormStrip matches={matches} />
      </section>

      {winRates.length > 2 && (
        <section aria-labelledby="progression" className="space-y-3">
          <h2 id="progression" className="text-xl">
            Progression
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <h3 className="text-base">Taux de victoire cumulé</h3>
              <p className="mt-1 mb-3 text-xs text-subtle">
                Calculé sur les {matches.length} parties chargées, de la plus ancienne à la plus
                récente.
              </p>
              <LineChart
                points={winRates}
                title="Taux de victoire cumulé au fil des parties"
                format={(v) => `${formatDecimal(v).replace(/,00$/, "")} %`}
                reference={50}
                min={0}
                max={100}
                color="var(--win)"
              />
            </Card>
            <Card>
              <h3 className="text-base">KDA par partie</h3>
              <p className="mt-1 mb-3 text-xs text-subtle">
                (Éliminations + assistances) / morts, partie par partie.
              </p>
              <LineChart
                points={kdas}
                title="KDA par partie"
                format={(v) => formatDecimal(v)}
                reference={1}
                min={0}
              />
            </Card>
          </div>
        </section>
      )}

      <section aria-labelledby="parties-titre" className="space-y-4">
        <h2 id="parties-titre" className="text-xl">
          Parties disponibles
        </h2>
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
      </section>
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
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-card" />
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
    <div className="space-y-12">
      <header className="card flex flex-wrap items-center gap-5 p-5 sm:p-7">
        <Avatar name={p.displayName} src={p.avatarUrl} className="size-20 text-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl sm:text-4xl">{p.displayName}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="mono text-subtle">{p.steamId}</span>
            {p.region && <span>{formatRegion(p.region)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RankBadge name={rank.name} imageUrl={rank.imageUrl} color={rank.color} size="lg" />
          <div>
            <p className="text-xs text-subtle">Rang</p>
            <p className="text-lg font-semibold tracking-[-0.03em]">{rank.name ?? "Non classé"}</p>
          </div>
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

      <section aria-labelledby="heros-titre" className="space-y-4">
        <h2 id="heros-titre" className="text-xl">
          Héros les plus joués
        </h2>
        <HeroBreakdown steamId={p.steamId} />
      </section>

      <Matches steamId={p.steamId} />
    </div>
  );
}
