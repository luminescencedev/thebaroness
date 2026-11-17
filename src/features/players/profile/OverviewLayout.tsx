import type { HeroSummary, MatchSummary, PlayerProfile, ProfileScope } from "@/api";
import type { usePlayerOverview } from "@/features/players/hooks";
import type { HeroRow } from "@/lib/stats";
import { ActivityWidget } from "./ActivityWidget";
import { MatchHistoryPreview } from "./MatchHistoryPreview";
import { RankModesWidget } from "./RankModesWidget";
import { RecentPerformance } from "./RecentPerformance";
import { TopHeroesWidget, type TopHero } from "./TopHeroesWidget";
import { scopeLabel } from "./scopeText";

/**
 * Deux colonnes selon la largeur du panneau (container query, pas du viewport) :
 * rail analytique à gauche (320 px), performance et parties à droite. Tout porte sur le MÊME scope.
 */
export function OverviewLayout({
  profile,
  scope,
  overview,
  matches,
  historyLoading,
  rows,
  heroById,
  capped,
  scopeQuery,
  onSeeMatches,
}: {
  profile: PlayerProfile;
  scope: ProfileScope;
  overview: ReturnType<typeof usePlayerOverview>;
  matches: MatchSummary[];
  historyLoading: boolean;
  rows: HeroRow[];
  heroById: Map<number, HeroSummary>;
  capped: boolean;
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
          <RankModesWidget profile={profile} overview={overview} scope={scope} />
          <ActivityWidget
            matches={matches}
            capped={capped}
            partial={profile.meta.isPartial}
            scopeFrom={overview.data?.coverage.requestedFrom ?? null}
          />
          <TopHeroesWidget
            rows={top}
            heroById={heroById}
            steamId={profile.player.steamId}
            scopeQuery={scopeQuery}
            state={overview.isPending ? "loading" : overview.isError ? "error" : "ready"}
          />
        </div>
        <div className="order-1 min-w-0 space-y-4 @[960px]:order-2">
          <RecentPerformance
            matches={matches}
            overview={overview}
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
