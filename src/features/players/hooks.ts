import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPlayer, getPlayerMatches, searchPlayers } from "@/api";

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

export function usePlayer(steamId: string) {
  return useQuery({
    queryKey: playerKeys.profile(steamId),
    queryFn: ({ signal }) => getPlayer(steamId, signal),
  });
}

export function usePlayerMatches(steamId: string) {
  return useInfiniteQuery({
    queryKey: playerKeys.matches(steamId),
    queryFn: ({ pageParam, signal }) =>
      getPlayerMatches(steamId, { limit: 20, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
