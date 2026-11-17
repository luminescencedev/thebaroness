import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getPlayer,
  getPlayerHeroes,
  getPlayerMatches,
  getPlayerOverview,
  refreshPlayer,
  searchPlayers,
  type ProfileScope,
} from "@/api";
import type { MatchFilters } from "./scope";

export const playerKeys = {
  search: (q: string) => ["players", "search", q] as const,
  profile: (steamId: string) => ["players", steamId] as const,
  /** Préfixe : toutes les listes de parties du joueur, quel que soit le filtre. */
  matchesAll: (steamId: string) => ["players", steamId, "matches"] as const,
  /** La clé porte TOUS les filtres : un nouveau filtre ne réutilise ni pages ni curseur. */
  matches: (steamId: string, f: MatchFilters) =>
    [
      "players",
      steamId,
      "matches",
      f.period,
      f.gameMode,
      f.matchMode,
      f.outcome,
      f.heroId,
    ] as const,
  overview: (steamId: string, s: ProfileScope) =>
    ["players", steamId, "overview", s.period, s.gameMode, s.matchMode] as const,
  heroes: (steamId: string, s: ProfileScope) =>
    ["players", steamId, "heroes", s.period, s.gameMode, s.matchMode] as const,
};

export function usePlayerSearch(q: string) {
  return useQuery({
    queryKey: playerKeys.search(q),
    queryFn: ({ signal }) => searchPlayers(q, signal),
    enabled: q.length > 0,
  });
}

export function usePlayer(steamId: string, options: { enabled?: boolean; live?: boolean } = {}) {
  return useQuery({
    queryKey: playerKeys.profile(steamId),
    queryFn: ({ signal }) => getPlayer(steamId, signal),
    enabled: options.enabled ?? steamId !== "",
    // Page profil : relecture douce toutes les 3 min et au retour sur l'onglet.
    refetchInterval: options.live ? 180_000 : false,
    refetchOnWindowFocus: options.live ?? false,
  });
}

/** Parties filtrées par le serveur, avant pagination (v1.9.0). Le curseur est lié aux filtres. */
export function usePlayerMatches(steamId: string, filters: MatchFilters) {
  return useInfiniteQuery({
    queryKey: playerKeys.matches(steamId, filters),
    queryFn: ({ pageParam, signal }) =>
      getPlayerMatches(
        steamId,
        {
          limit: 50,
          cursor: pageParam,
          period: filters.period,
          gameMode: filters.gameMode,
          matchMode: filters.matchMode,
          outcome: filters.outcome === "all" ? undefined : filters.outcome,
          heroId: filters.heroId ?? undefined,
        },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function usePlayerOverview(steamId: string, scope: ProfileScope) {
  return useQuery({
    queryKey: playerKeys.overview(steamId, scope),
    queryFn: ({ signal }) => getPlayerOverview(steamId, scope, signal),
    enabled: steamId !== "",
  });
}

export function usePlayerHeroes(steamId: string, scope: ProfileScope) {
  return useQuery({
    queryKey: playerKeys.heroes(steamId, scope),
    queryFn: ({ signal }) => getPlayerHeroes(steamId, scope, signal),
    enabled: steamId !== "",
  });
}

/** Borne de l'historique chargé automatiquement ; au-delà, bouton « Charger plus ». */
export const HISTORY_CAP = 200;

/** Historique complet jusqu'à HISTORY_CAP parties, chargé page après page en arrière-plan. */
export function usePlayerHistory(steamId: string, scope: ProfileScope) {
  const query = usePlayerMatches(steamId, { ...scope, outcome: "all", heroId: null });
  const loaded = query.data?.pages.reduce((n, p) => n + p.items.length, 0) ?? 0;
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError && loaded < HISTORY_CAP)
      void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, loaded, fetchNextPage]);
  const matches = query.data?.pages.flatMap((p) => p.items) ?? [];
  return { ...query, matches, loaded, capped: loaded >= HISTORY_CAP && Boolean(hasNextPage) };
}

/** Actualisation forcée : remplace le profil affiché et relit historique et héros. */
export function useRefreshPlayer(steamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => refreshPlayer(steamId),
    onSuccess: (profile) => {
      qc.setQueryData(playerKeys.profile(steamId), profile);
      // Préfixes : toutes les variantes de scope et de filtres sont relues.
      void qc.invalidateQueries({ queryKey: playerKeys.matchesAll(steamId) });
      void qc.invalidateQueries({ queryKey: ["players", steamId, "heroes"] });
      void qc.invalidateQueries({ queryKey: ["players", steamId, "overview"] });
    },
  });
}
