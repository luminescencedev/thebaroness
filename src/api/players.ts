import { request } from "./client";
import type {
  MatchHistoryParams,
  MatchHistoryResponse,
  PlayerProfile,
  PlayerSearchResponse,
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
    query: { limit: params.limit, cursor: params.cursor },
    signal,
  });
