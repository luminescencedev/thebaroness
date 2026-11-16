import { Tabs } from "@base-ui/react/tabs";
import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { isApiError } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { RankBadge } from "@/components/media/RankBadge";
import { Avatar, Button, EmptyState, Skeleton, buttonStyles } from "@/components/ui";
import { MatchesTable } from "@/features/matches/MatchesTable";
import { HeroesTab } from "@/features/players/HeroesTab";
import { PlayerOverview } from "@/features/players/PlayerOverview";
import { usePlayer, usePlayerMatches } from "@/features/players/hooks";
import { rememberPlayer } from "@/features/search/recents";
import { FollowButton } from "@/features/tracked-players/FollowButton";
import { formatRegion, timeAgo } from "@/lib/format";

const TABS = [
  { value: "overview", label: "Aperçu" },
  { value: "heroes", label: "Héros" },
  { value: "matches", label: "Parties" },
];

function MatchesTab({ steamId }: { steamId: string }) {
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
  if (!q.data)
    return (
      <ErrorState
        error={q.error}
        title="Historique indisponible"
        onRetry={() => void q.refetch()}
      />
    );
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
      <MatchesTable matches={matches} />
      {q.hasNextPage && (
        <div className="text-center">
          <Button
            variant="secondary"
            onClick={() => void q.fetchNextPage()}
            loading={q.isFetchingNextPage}
          >
            Charger {q.data.pages.at(-1)?.items.length ?? 20} parties de plus
          </Button>
        </div>
      )}
      {q.isFetchNextPageError && <ErrorState error={q.error} title="Chargement impossible" />}
      {meta && <DataMetaNotice meta={meta} onRetry={() => void q.refetch()} />}
    </div>
  );
}

function OverviewTab({
  steamId,
  profile,
}: {
  steamId: string;
  profile: NonNullable<ReturnType<typeof usePlayer>["data"]>;
}) {
  const q = usePlayerMatches(steamId);
  const matches = q.data?.pages.flatMap((p) => p.items) ?? [];
  if (q.isPending) return <Skeleton className="h-72 rounded-card" aria-busy="true" />;
  return <PlayerOverview profile={profile} matches={matches} steamId={steamId} />;
}

export function PlayerPage() {
  const { steamId = "" } = useParams();
  const player = usePlayer(steamId);
  useDocumentTitle(player.data?.player.displayName ?? "Profil public");

  const viewed = player.data?.player;
  useEffect(() => {
    if (viewed)
      rememberPlayer({
        steamId: viewed.steamId,
        displayName: viewed.displayName,
        avatarUrl: viewed.avatarUrl,
      });
  }, [viewed]);

  if (player.isPending) {
    return <BrandLoader message="Le Doorman monte les parties du joueur" />;
  }

  if (player.isError) {
    if (isApiError(player.error) && player.error.status === 404) {
      return (
        <EmptyState
          icon="search"
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
        title="Profil indisponible pour le moment"
        onRetry={() => void player.refetch()}
        extra={
          <Link to="/tracked" className={buttonStyles("secondary")}>
            Mes suivis
          </Link>
        }
      />
    );
  }

  const { player: p, stats, rank, meta } = player.data;

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar
          name={p.displayName}
          src={p.avatarUrl}
          className="size-[60px] rounded-2xl text-2xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl sm:text-4xl">{p.displayName}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="mono text-subtle">{p.steamId}</span>
            {p.region && <span>{formatRegion(p.region)}</span>}
            <span>Collecté {timeAgo(meta.fetchedAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {rank.name && (
            <span className="flex items-center gap-2 rounded-full bg-accent/15 py-1 pr-3 pl-1.5 text-sm text-[#d2ccff]">
              <RankBadge name={rank.name} imageUrl={rank.imageUrl} size="sm" />
              {rank.name}
            </span>
          )}
          <div className="hidden sm:block">
            <FollowButton steamId={p.steamId} name={p.displayName} />
          </div>
        </div>
      </header>

      <DataMetaNotice meta={meta} showDate={false} onRetry={() => void player.refetch()} />

      <Tabs.Root defaultValue="overview">
        <Tabs.List
          aria-label="Sections du profil"
          className="relative mb-6 flex gap-1 border-b border-border"
        >
          {TABS.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              className="pressable hover-text h-11 px-3.5 text-sm font-medium text-subtle data-[selected]:text-text"
            >
              {t.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="absolute -bottom-px left-0 h-0.5 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-sm bg-text transition-[translate,width] duration-[220ms] ease-[var(--ease-in-out)] motion-reduce:transition-none" />
        </Tabs.List>
        <Tabs.Panel value="overview">
          <OverviewTab steamId={p.steamId} profile={player.data} />
        </Tabs.Panel>
        <Tabs.Panel value="heroes">
          <HeroesTab steamId={p.steamId} />
        </Tabs.Panel>
        <Tabs.Panel value="matches">
          <MatchesTab steamId={p.steamId} />
        </Tabs.Panel>
      </Tabs.Root>

      <p className="text-xs text-subtle">
        Calculé sur les {stats.matchesPlayed ?? "n/d"} parties disponibles via Deadlock API, projet
        communautaire indépendant de Valve. L&apos;historique peut être incomplet.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-b from-transparent to-bg to-30% px-4 pt-3 pb-6 sm:hidden">
        <FollowButton steamId={p.steamId} name={p.displayName} block />
      </div>
    </div>
  );
}
