import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, getMatch, type LeaderboardRegion } from "@/api";

export const useLeaderboard = (region: LeaderboardRegion) =>
  useQuery({
    queryKey: ["leaderboard", region],
    queryFn: ({ signal }) => getLeaderboard(region, signal),
  });

export const useMatch = (matchId: string) =>
  useQuery({ queryKey: ["matches", matchId], queryFn: ({ signal }) => getMatch(matchId, signal) });
