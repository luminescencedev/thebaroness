import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getPlayer,
  getPlayerActivity,
  getPlayerHeroes,
  getPlayerMatches,
  getPlayerOverview,
  getPlayerRankHistory,
  getPlayerRelationships,
  getPlayerTrends,
  refreshPlayer,
  searchPlayers,
  type ProfileScope,
} from "@/api";
import type { MatchFilters } from "./scope";

export const playerKeys = {
  /** Clé normalisée : « Corvid », « corvid » et « corvid  » partagent une entrée (le back met en cache en minuscules). */
  search: (q: string) => ["players", "search", q.trim().toLowerCase()] as const,
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

/**
 * Parties du scope lues pour la courbe (max 50) et l'aperçu. L'activité vient de `/activity` et ne dépend
 * plus de ce chargement ; au-delà, l'onglet Parties pagine avec « Charger plus ».
 */
export const HISTORY_CAP = 50;

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
      for (const k of ["activity", "rank-history", "relationships", "trends"])
        void qc.invalidateQueries({ queryKey: ["players", steamId, k] });
    },
  });
}

/** Activité sur 12 semaines (jours UTC, historique complet), au format et type du scope. */
export function usePlayerActivity(steamId: string, scope: ProfileScope) {
  return useQuery({
    queryKey: ["players", steamId, "activity", scope.gameMode, scope.matchMode],
    queryFn: ({ signal }) =>
      getPlayerActivity(
        steamId,
        { weeks: 12, gameMode: scope.gameMode, matchMode: scope.matchMode },
        signal,
      ),
    enabled: steamId !== "",
  });
}

/** Rang observé sur de vraies parties classées. Un back plus ancien (404) laisse le widget vide. */
export function usePlayerRankHistory(steamId: string, scope: ProfileScope) {
  return useQuery({
    queryKey: ["players", steamId, "rank-history", scope.period],
    queryFn: ({ signal }) => getPlayerRankHistory(steamId, scope.period, signal),
    enabled: steamId !== "",
    retry: false,
  });
}

/** Joués avec et contre. Le back n'a que `normal` ou `street_brawl` (jamais « tous »). */
export function usePlayerRelationships(steamId: string, scope: ProfileScope) {
  const gameMode = scope.gameMode === "street_brawl" ? "street_brawl" : "normal";
  return useQuery({
    queryKey: ["players", steamId, "relationships", scope.period, gameMode],
    queryFn: ({ signal }) =>
      getPlayerRelationships(steamId, { period: scope.period, gameMode, limit: 6 }, signal),
    enabled: steamId !== "",
    retry: false,
  });
}

/** Tendance N contre N (N = fenêtre de la courbe). Indépendante de la période du scope, suit ses modes. */
export function usePlayerTrends(steamId: string, scope: ProfileScope, size: number) {
  return useQuery({
    queryKey: ["players", steamId, "trends", size, scope.period, scope.gameMode, scope.matchMode],
    queryFn: ({ signal }) =>
      getPlayerTrends(
        steamId,
        { size, period: scope.period, gameMode: scope.gameMode, matchMode: scope.matchMode },
        signal,
      ),
    enabled: steamId !== "",
    retry: false,
  });
}
