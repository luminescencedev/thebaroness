import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, getMatch, getPlayerHeroes, type LeaderboardRegion } from "@/api";

export const useLeaderboard = (region: LeaderboardRegion) =>
  useQuery({
    queryKey: ["leaderboard", region],
    queryFn: ({ signal }) => getLeaderboard(region, signal),
  });

export const useMatch = (matchId: string) =>
  useQuery({ queryKey: ["matches", matchId], queryFn: ({ signal }) => getMatch(matchId, signal) });

export const usePlayerHeroes = (steamId: string) =>
  useQuery({
    queryKey: ["players", steamId, "heroes"],
    queryFn: ({ signal }) => getPlayerHeroes(steamId, signal),
  });
