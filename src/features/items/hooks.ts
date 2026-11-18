import { keepPreviousData, useQuery, type PlaceholderDataFunction } from "@tanstack/react-query";
import {
  getHeroBuilds,
  getHeroItemPairs,
  getItem,
  getItemStats,
  getItems,
  getItemsStats,
  type AnalyticsParams,
  type BuildSort,
  type HeroBuildsResponse,
  type HeroItemPairsResponse,
  type ItemStatsResponse,
} from "@/api";

/** Le catalogue change à chaque version du client : une heure de cache suffit (le back relit chaque heure). */
const CATALOG_STALE = 60 * 60_000;
/** Les agrégats sont mis en cache 1 h côté back. */
const STATS_STALE = 10 * 60_000;

/**
 * Garde la réponse précédente pendant un changement de FILTRE (période, type de partie, tri), mais jamais
 * lorsque l'entité change (autre héros ou autre objet) : sinon les chiffres d'un autre héros resteraient
 * affichés sous le nom du nouveau. L'identifiant de l'entité est le 2e élément de la clé de requête.
 */
const keepSameEntity =
  <T>(entityId: string): PlaceholderDataFunction<T> =>
  (prev, prevQuery) =>
    prevQuery?.queryKey[1] === entityId ? prev : undefined;

/** Options partagées du catalogue d'objets de boutique : UNE clé, UNE requête, pour toutes les pages. */
const upgradeCatalogOptions = (enabled: boolean) => ({
  queryKey: ["items", "upgrade"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => getItems({ type: "upgrade" }, signal),
  enabled,
  staleTime: CATALOG_STALE,
  retry: false,
});

/** Catalogue brut (méta, version du client) : pages Items, builds, paires. */
export const useUpgradeCatalog = (enabled = true) => useQuery(upgradeCatalogOptions(enabled));

/**
 * Même requête, vue indexée par identifiant d'objet : scoreboard, lignes de partie et profil. `enabled` permet de
 * ne charger le catalogue qu'à la première ligne dépliée.
 */
export const useItemCatalog = (enabled = true) =>
  useQuery({
    ...upgradeCatalogOptions(enabled),
    select: (r) => new Map(r.items.map((i) => [i.id, i])),
  });

export const useItem = (itemId: string) =>
  useQuery({
    queryKey: ["items", "detail", itemId],
    queryFn: ({ signal }) => getItem(itemId, signal),
    staleTime: CATALOG_STALE,
  });

export const useItemsStats = (params: AnalyticsParams) =>
  useQuery({
    queryKey: ["items", "stats", params.period, params.matchMode ?? "all", params.heroId ?? null],
    queryFn: ({ signal }) => getItemsStats(params, signal),
    staleTime: STATS_STALE,
    placeholderData: keepPreviousData,
  });

export const useItemStats = (itemId: string, params: AnalyticsParams) =>
  useQuery({
    queryKey: [
      "items",
      itemId,
      "stats",
      params.period,
      params.matchMode ?? "all",
      params.heroId ?? null,
    ],
    queryFn: ({ signal }) => getItemStats(itemId, params, signal),
    staleTime: STATS_STALE,
    placeholderData: keepSameEntity<ItemStatsResponse>(itemId),
  });

export const useHeroBuilds = (heroId: string, sort: BuildSort, limit = 10) =>
  useQuery({
    queryKey: ["heroes", heroId, "builds", sort, limit],
    queryFn: ({ signal }) => getHeroBuilds(heroId, { sort, limit }, signal),
    staleTime: STATS_STALE,
    placeholderData: keepSameEntity<HeroBuildsResponse>(heroId),
  });

export const useHeroItemPairs = (
  heroId: string,
  params: Omit<AnalyticsParams, "heroId"> & { itemId?: number },
  limit = 20,
  enabled = true,
) =>
  useQuery({
    enabled,
    queryKey: [
      "heroes",
      heroId,
      "item-pairs",
      params.period,
      params.matchMode ?? "all",
      params.itemId ?? null,
      limit,
    ],
    queryFn: ({ signal }) => getHeroItemPairs(heroId, { ...params, limit }, signal),
    staleTime: STATS_STALE,
    placeholderData: keepSameEntity<HeroItemPairsResponse>(heroId),
  });
