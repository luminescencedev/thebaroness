import { request } from "./client";
import type {
  AnalyticsParams,
  BuildSort,
  HeroBuildsResponse,
  HeroItemPairsResponse,
  ItemDetailResponse,
  ItemStatsListResponse,
  ItemStatsResponse,
  HeroDetailResponse,
  HeroListResponse,
  ItemListResponse,
  HeroMetaBatch,
  HeroStatsResponse,
  LeaderboardRegion,
  MapAssets,
  LeaderboardResponse,
  MatchDetailResponse,
  PlayerHeroesResponse,
  ProfileScope,
  RankListResponse,
  SteamId,
} from "./types";

export const listHeroes = (signal?: AbortSignal) =>
  request<HeroListResponse>("/heroes", { signal });

export const getHero = (heroId: number | string, signal?: AbortSignal) =>
  request<HeroDetailResponse>(`/heroes/${encodeURIComponent(String(heroId))}`, { signal });

export const getHeroStats = (heroId: number | string, signal?: AbortSignal) =>
  request<HeroStatsResponse>(`/heroes/${encodeURIComponent(String(heroId))}/stats`, { signal });

/** Méta de plusieurs héros en UNE requête (v1.14.0). Sans `heroIds` : tous les héros jouables. */
export const getHeroesStats = (heroIds?: number[], signal?: AbortSignal) =>
  request<HeroMetaBatch>("/heroes/stats", {
    query: { heroIds: heroIds?.length ? heroIds.join(",") : undefined },
    signal,
  });

export const listRanks = (signal?: AbortSignal) => request<RankListResponse>("/ranks", { signal });

export const getLeaderboard = (region: LeaderboardRegion, signal?: AbortSignal) =>
  request<LeaderboardResponse>("/leaderboard", { query: { region }, signal });

export const getMatch = (matchId: string, signal?: AbortSignal) =>
  request<MatchDetailResponse>(`/matches/${encodeURIComponent(matchId)}`, { signal });

/** Sans scope : tout l'historique (feuille du classement). Avec scope : période et modes (v1.9.0). */
export const getPlayerHeroes = (steamId: SteamId, scope?: ProfileScope, signal?: AbortSignal) =>
  request<PlayerHeroesResponse>(`/players/${encodeURIComponent(steamId)}/heroes`, {
    query: scope
      ? { period: scope.period, gameMode: scope.gameMode, matchMode: scope.matchMode }
      : undefined,
    signal,
  });

export const getMap = (signal?: AbortSignal) => request<MapAssets>("/map", { signal });

/** Catalogue des objets (une requête pour tout le catalogue, jamais un appel par objet). */
export const getItems = (
  params: { type?: "upgrade" | "ability" | "weapon" } = {},
  signal?: AbortSignal,
) => request<ItemListResponse>("/items", { query: params, signal });

export const getItem = (itemId: number | string, signal?: AbortSignal) =>
  request<ItemDetailResponse>(`/items/${encodeURIComponent(String(itemId))}`, { signal });

const analyticsQuery = (p: AnalyticsParams) => ({
  period: p.period,
  matchMode: p.matchMode,
  heroId: p.heroId,
});

/** Une seule requête d'agrégats par jeu de filtres, jointe au catalogue côté front. */
export const getItemsStats = (params: AnalyticsParams, signal?: AbortSignal) =>
  request<ItemStatsListResponse>("/items/stats", { query: analyticsQuery(params), signal });

export const getItemStats = (
  itemId: number | string,
  params: AnalyticsParams,
  signal?: AbortSignal,
) =>
  request<ItemStatsResponse>(`/items/${encodeURIComponent(String(itemId))}/stats`, {
    query: analyticsQuery(params),
    signal,
  });

export const getHeroBuilds = (
  heroId: number | string,
  params: { sort: BuildSort; limit?: number },
  signal?: AbortSignal,
) =>
  request<HeroBuildsResponse>(`/heroes/${encodeURIComponent(String(heroId))}/builds`, {
    query: params,
    signal,
  });

export const getHeroItemPairs = (
  heroId: number | string,
  params: Omit<AnalyticsParams, "heroId"> & { itemId?: number; limit?: number },
  signal?: AbortSignal,
) =>
  request<HeroItemPairsResponse>(`/heroes/${encodeURIComponent(String(heroId))}/item-pairs`, {
    query: params,
    signal,
  });
