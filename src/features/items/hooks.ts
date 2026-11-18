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

/**
 * Catalogue des objets de boutique : MÊME clé que `useItemCatalog` du Match Detail, donc une seule requête
 * partagée par le scoreboard, le profil, les builds et le catalogue.
 */
export const useUpgradeCatalog = () =>
  useQuery({
    queryKey: ["items", "upgrade"],
    queryFn: ({ signal }) => getItems({ type: "upgrade" }, signal),
    staleTime: CATALOG_STALE,
    retry: false,
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
