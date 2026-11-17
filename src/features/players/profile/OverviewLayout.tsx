import type { HeroSummary, MatchSummary, PlayerProfile, ProfileScope } from "@/api";
import type {
  usePlayerActivity,
  usePlayerOverview,
  usePlayerRankHistory,
  usePlayerRelationships,
} from "@/features/players/hooks";
import type { HeroRow } from "@/lib/stats";
import { ActivityWidget } from "./ActivityWidget";
import { MatchHistoryPreview } from "./MatchHistoryPreview";
import { RankModesWidget } from "./RankModesWidget";
import { RelationshipsWidget } from "./RelationshipsWidget";
import { RecentPerformance } from "./RecentPerformance";
import { TopHeroesWidget, type TopHero } from "./TopHeroesWidget";
import { modeScopeLabel, scopeLabel } from "./scopeText";

/**
 * Deux colonnes selon la largeur du panneau (container query, pas du viewport) :
 * rail analytique à gauche (320 px), performance et parties à droite. Tout porte sur le MÊME scope.
 */
export function OverviewLayout({
  profile,
  scope,
  overview,
  activity,
  rankHistory,
  relationships,
  matches,
  historyLoading,
  rows,
  heroById,
  scopeQuery,
  onSeeMatches,
}: {
  profile: PlayerProfile;
  scope: ProfileScope;
  overview: ReturnType<typeof usePlayerOverview>;
  activity: ReturnType<typeof usePlayerActivity>;
  rankHistory: ReturnType<typeof usePlayerRankHistory>;
  relationships: ReturnType<typeof usePlayerRelationships>;
  matches: MatchSummary[];
  historyLoading: boolean;
  rows: HeroRow[];
  heroById: Map<number, HeroSummary>;
  scopeQuery: string;
  onSeeMatches: () => void;
}) {
  const metaOf = new Map(rows.map((r) => [r.heroId, r.metaWinRate]));
  const top: TopHero[] = (overview.data?.topHeroes ?? []).map((h) => ({
    ...h,
    metaWinRate: metaOf.get(h.heroId) ?? null,
  }));
  return (
    <div className="@container">
      <div className="grid gap-4 @[960px]:grid-cols-[320px_minmax(0,1fr)] @[960px]:items-start">
        {/* Mobile : performance et parties d'abord, widgets secondaires ensuite. */}
        <div className="order-2 space-y-4 @[960px]:order-1">
          <RankModesWidget
            profile={profile}
            overview={overview}
            scope={scope}
            rankHistory={rankHistory}
          />
          <ActivityWidget activity={activity} scopeText={modeScopeLabel(scope)} />
          <TopHeroesWidget
            rows={top}
            heroById={heroById}
            steamId={profile.player.steamId}
            scopeQuery={scopeQuery}
            state={overview.isPending ? "loading" : overview.isError ? "error" : "ready"}
          />
          <RelationshipsWidget
            relationships={relationships}
            gameModeNote={
              scope.gameMode === "all"
                ? "Format normal (la source n'a pas de « tous les formats »)."
                : null
            }
          />
        </div>
        <div className="order-1 min-w-0 space-y-4 @[960px]:order-2">
          <RecentPerformance
            matches={matches}
            overview={overview}
            steamId={profile.player.steamId}
            scope={scope}
            scopeText={scopeLabel(scope)}
            historyLoading={historyLoading}
          />
          <MatchHistoryPreview
            matches={matches}
            heroById={heroById}
            ownerSteamId={profile.player.steamId}
            onSeeAll={onSeeMatches}
          />
        </div>
      </div>
    </div>
  );
}
