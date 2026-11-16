import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getPlayer, getPlayerMatches, refreshPlayer, searchPlayers } from "@/api";

export const playerKeys = {
  search: (q: string) => ["players", "search", q] as const,
  profile: (steamId: string) => ["players", steamId] as const,
  matches: (steamId: string) => ["players", steamId, "matches"] as const,
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

export function usePlayerMatches(steamId: string) {
  return useInfiniteQuery({
    queryKey: playerKeys.matches(steamId),
    queryFn: ({ pageParam, signal }) =>
      getPlayerMatches(steamId, { limit: 50, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Borne de l'historique chargé automatiquement ; au-delà, bouton « Charger plus ». */
export const HISTORY_CAP = 200;

/** Historique complet jusqu'à HISTORY_CAP parties, chargé page après page en arrière-plan. */
export function usePlayerHistory(steamId: string) {
  const query = usePlayerMatches(steamId);
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
      void qc.invalidateQueries({ queryKey: playerKeys.matches(steamId) });
      void qc.invalidateQueries({ queryKey: ["players", steamId, "heroes"] });
    },
  });
}
