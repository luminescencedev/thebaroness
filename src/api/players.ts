import { request } from "./client";
import type {
  MatchHistoryParams,
  MatchHistoryResponse,
  PlayerActivity,
  PlayerOverview,
  PlayerRelationships,
  PlayerProfile,
  PlayerSearchResponse,
  ProfileScope,
  RankHistory,
  SteamId,
} from "./types";

export const searchPlayers = (q: string, signal?: AbortSignal) =>
  request<PlayerSearchResponse>("/players/search", { query: { q }, signal });

export const getPlayer = (steamId: SteamId, signal?: AbortSignal) =>
  request<PlayerProfile>(`/players/${encodeURIComponent(steamId)}`, { signal });

export const getPlayerMatches = (
  steamId: SteamId,
  params: MatchHistoryParams = {},
  signal?: AbortSignal,
) =>
  request<MatchHistoryResponse>(`/players/${encodeURIComponent(steamId)}/matches`, {
    query: {
      limit: params.limit,
      cursor: params.cursor,
      period: params.period,
      gameMode: params.gameMode,
      matchMode: params.matchMode,
      heroId: params.heroId,
      outcome: params.outcome,
    },
    signal,
  });

/** Synthèse officielle d'une période (v1.9.0). Toujours un scope explicite : pas de défaut implicite. */
export const getPlayerOverview = (steamId: SteamId, scope: ProfileScope, signal?: AbortSignal) =>
  request<PlayerOverview>(`/players/${encodeURIComponent(steamId)}/overview`, {
    query: { period: scope.period, gameMode: scope.gameMode, matchMode: scope.matchMode },
    signal,
  });

/** Relit profil et historique auprès de la source (délai minimum de 60 s par joueur côté back). */
export const refreshPlayer = (steamId: SteamId) =>
  request<PlayerProfile>(`/players/${encodeURIComponent(steamId)}/refresh`, { method: "POST" });

/** Un objet par jour UTC, jour sans partie = 0 (historique complet). Suit le format et le type du scope. */
export const getPlayerActivity = (
  steamId: SteamId,
  params: { weeks?: number; gameMode?: string; matchMode?: string } = {},
  signal?: AbortSignal,
) =>
  request<PlayerActivity>(`/players/${encodeURIComponent(steamId)}/activity`, {
    query: params,
    signal,
  });

/** Un point par partie classée dont la source fournit le badge : aucun MMR inventé. */
export const getPlayerRankHistory = (
  steamId: SteamId,
  period: ProfileScope["period"],
  signal?: AbortSignal,
) =>
  request<RankHistory>(`/players/${encodeURIComponent(steamId)}/rank-history`, {
    query: { period },
    signal,
  });

/** Joués avec et contre. `gameMode` n'accepte que normal ou street_brawl (pas « tous »). */
export const getPlayerRelationships = (
  steamId: SteamId,
  params: { period?: string; gameMode?: "normal" | "street_brawl"; limit?: number } = {},
  signal?: AbortSignal,
) =>
  request<PlayerRelationships>(`/players/${encodeURIComponent(steamId)}/relationships`, {
    query: params,
    signal,
  });
