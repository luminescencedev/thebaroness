import { request } from "./client";
import type {
  HeroDetailResponse,
  HeroListResponse,
  ItemListResponse,
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
