import type { HeroDetail, HeroMetaStats, RankTier } from "@/api";
import { ChartFrame, DeltaChip, RadialGauge } from "@/components/charts";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { RankBadge } from "@/components/media/RankBadge";
import { Skeleton } from "@/components/ui";
import { useHeroStats, useRanks } from "@/features/heroes/hooks";
import { formatDecimal, formatInt, formatPercent } from "@/lib/format";
import { kda } from "@/lib/stats";

export function TierBars({
  stats,
  ranks,
  color,
}: {
  stats: HeroMetaStats;
  ranks: RankTier[] | undefined;
  color: string;
}) {
  const rows = stats.winRateByTier;
  const known = rows.filter((r) => r.winRate !== null);
  const lo = Math.min(40, ...known.map((r) => r.winRate as number)) - 2;
  const hi = Math.max(60, ...known.map((r) => r.winRate as number)) + 2;
  return (
    <div className="overflow-x-auto">
      <div className="relative flex h-44 min-w-[400px] items-end gap-1.5">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 border-t border-dashed border-white/30"
          style={{ bottom: `${((50 - lo) / (hi - lo)) * 100}%` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] text-subtle">50 %</span>
        </span>
        {rows.map((r) => {
          const rank = ranks?.find((x) => x.tier === r.tier);
          const h = r.winRate === null ? 6 : ((r.winRate - lo) / (hi - lo)) * 100;
          return (
            <div
              key={r.tier}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${rank?.name ?? r.tier} : ${r.winRate === null ? "échantillon trop faible" : `${r.winRate} %`}`}
            >
              {r.winRate !== null && (
                <span className="text-[10px] text-muted tabular-nums">{Math.round(r.winRate)}</span>
              )}
              <span
                className="w-full rounded-t-md"
                style={{
                  height: `${h}%`,
                  background:
                    r.winRate === null
                      ? "repeating-linear-gradient(45deg, rgb(255 255 255 / .08) 0 4px, transparent 4px 8px)"
                      : `linear-gradient(180deg, ${rank?.color ?? color}, color-mix(in srgb, ${rank?.color ?? color} 35%, transparent))`,
                  border: r.winRate === null ? "1px dashed rgb(255 255 255 / .15)" : undefined,
                }}
              />
              <RankBadge name={rank?.name} imageUrl={rank?.imageUrl} size="sm" />
              <span className="sr-only">
                {rank?.name} : {r.winRate === null ? "échantillon trop faible" : `${r.winRate} %`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-subtle">
        Paliers sans barre pleine : échantillon trop faible (moins de 200 parties).
      </p>
    </div>
  );
}

function useMeta(hero: HeroDetail) {
  return { stats: useHeroStats(String(hero.id)), ranks: useRanks() };
}

/** Quatre indicateurs de méta : taux de victoire, choix, KDA moyen, parties analysées. */
export function MetaKpis({ hero }: { hero: HeroDetail }) {
  const { stats, ranks } = useMeta(hero);
  if (stats.isPending) return <Skeleton className="h-28 rounded-card" />;
  if (stats.isError)
    return (
      <ErrorState
        error={stats.error}
        title="Statistiques indisponibles"
        onRetry={() => void stats.refetch()}
      />
    );
  const s = stats.data.stats;
  const heroKda = kda(s.avgKills, s.avgDeaths, s.avgAssists);
  const best = s.winRateByTier
    .filter((t) => t.winRate !== null)
    .sort((a, b) => (b.winRate as number) - (a.winRate as number))[0];
  const bestRank = ranks.data?.items.find((r) => r.tier === best?.tier);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          className="card-hero flex items-center gap-4 p-5"
          style={{ ["--hc" as string]: "#3DD68C" }}
        >
          <RadialGauge
            value={s.winRate}
            mark={50}
            size={72}
            label={`Taux de victoire ${formatPercent(s.winRate)}`}
          >
            <span className="text-xs font-semibold tabular-nums">
              {s.winRate === null ? "n/d" : `${Math.round(s.winRate)} %`}
            </span>
          </RadialGauge>
          <div>
            <p className="text-xs text-muted">Taux de victoire</p>
            <DeltaChip
              value={s.winRate === null ? null : s.winRate - 50}
              unit=" pts"
              threshold={0.5}
              context="face à 50 %"
            />
          </div>
        </div>
        <div className="card-hero p-5" style={{ ["--hc" as string]: hero.color }}>
          <p className="text-xs text-muted">Taux de choix</p>
          <p className="mt-2 text-[28px] leading-none font-semibold tabular-nums">
            {formatPercent(s.pickRate)}
          </p>
          <p className="mt-2 text-xs text-subtle">des parties des 30 derniers jours</p>
        </div>
        <div className="card-hero p-5" style={{ ["--hc" as string]: "#8B7CFF" }}>
          <p className="text-xs text-muted">KDA moyen</p>
          <p className="mt-2 text-[28px] leading-none font-semibold tabular-nums">
            {formatDecimal(heroKda)}
          </p>
          <p className="mt-2 text-xs text-subtle tabular-nums">
            {formatDecimal(s.avgKills)} / {formatDecimal(s.avgDeaths)} /{" "}
            {formatDecimal(s.avgAssists)}
          </p>
        </div>
        <div className="card-hero p-5" style={{ ["--hc" as string]: "#F5B14C" }}>
          <p className="text-xs text-muted">Parties analysées</p>
          <p className="mt-2 text-[28px] leading-none font-semibold tabular-nums">
            {formatInt(s.matches)}
          </p>
          {best && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
              Meilleur palier :{" "}
              <RankBadge name={bestRank?.name} imageUrl={bestRank?.imageUrl} size="sm" label />
            </p>
          )}
        </div>
      </div>
      <DataMetaNotice meta={stats.data.meta} />
    </div>
  );
}

/** Taux de victoire par palier de rang (agrégat des 30 derniers jours : pas de série temporelle). */
export function TierChart({ hero }: { hero: HeroDetail }) {
  const { stats, ranks } = useMeta(hero);
  if (stats.isPending) return <Skeleton className="h-64 rounded-card" />;
  if (stats.isError)
    return (
      <ErrorState
        error={stats.error}
        title="Statistiques indisponibles"
        onRetry={() => void stats.refetch()}
      />
    );
  const s = stats.data.stats;
  const known = s.winRateByTier.filter((t) => t.winRate !== null);
  return (
    <ChartFrame
      id={`tiers-${hero.id}`}
      title="Taux de victoire par rang"
      subtitle="30 derniers jours, par palier de rang"
      summary={s.winRateByTier
        .map(
          (t) =>
            `${ranks.data?.items.find((r) => r.tier === t.tier)?.name ?? t.tier} : ${t.winRate === null ? "n/d" : `${t.winRate} %`}`,
        )
        .join(", ")}
      points={known.length ? 5 : 0}
    >
      <TierBars stats={s} ranks={ranks.data?.items} color={hero.color} />
    </ChartFrame>
  );
}
