import { ErrorState } from "@/components/ErrorState";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { EmptyState, Skeleton, cn } from "@/components/ui";
import { PairsList } from "@/features/items/PairsList";
import { useHeroItemPairs, useUpgradeCatalog } from "@/features/items/hooks";
import { StatsScopeBar } from "@/features/items/StatsScopeBar";
import { scopeLabel, useStatsScope } from "@/features/items/statsScope";

/** Paires d'items achetées ensemble par ce héros : association observée, pas une recommandation. */
export function PairsPanel({ heroId, color }: { heroId: number; color: string }) {
  const { scope, setPeriod, setMatchMode } = useStatsScope();
  const pairs = useHeroItemPairs(String(heroId), scope, 15);
  const catalog = useUpgradeCatalog();
  const byId = new Map((catalog.data?.items ?? []).map((i) => [i.id, i]));
  const d = pairs.data;
  const served = d
    ? scopeLabel({
        period: d.filters.period,
        matchMode: d.filters.matchMode === "all" ? undefined : d.filters.matchMode,
      })
    : null;

  return (
    <section aria-labelledby="pairs" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="pairs" className="text-xl">
            Items achetés ensemble
          </h2>
          <p className="mt-1 text-xs text-subtle" aria-live="polite">
            {served ?? "Chargement…"}
            {pairs.isPlaceholderData ? ", actualisation en cours" : ""}. Une association observée
            n'est ni une causalité ni une recommandation.
          </p>
        </div>
        <StatsScopeBar scope={scope} onPeriod={setPeriod} onMode={setMatchMode} />
      </div>
      <div
        aria-busy={pairs.isFetching}
        className={cn(pairs.isPlaceholderData && "opacity-60 transition-opacity")}
      >
        {pairs.isPending ? (
          <Skeleton className="h-56 rounded-card" />
        ) : pairs.isError && !d ? (
          <ErrorState
            error={pairs.error}
            title="Associations indisponibles"
            onRetry={() => void pairs.refetch()}
          />
        ) : d && d.items.length === 0 ? (
          <EmptyState
            title="Aucune association connue"
            description="Aucune paire d'items n'atteint le seuil de la source pour ces filtres. Élargissez la période."
          />
        ) : d ? (
          <PairsList pairs={d.items} catalog={byId} color={color} />
        ) : null}
      </div>
      {d && <DataMetaNotice meta={d.meta} />}
    </section>
  );
}
