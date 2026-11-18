import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, getMatch, type LeaderboardRegion } from "@/api";

export const useLeaderboard = (region: LeaderboardRegion) =>
  useQuery({
    queryKey: ["leaderboard", region],
    queryFn: ({ signal }) => getLeaderboard(region, signal),
    // Premier appel à froid : jusqu'à ~10 s côté back (résolution des rangs). Le classement change peu :
    // revenir sur une région déjà vue ne doit pas relancer ce coût.
    staleTime: 5 * 60_000,
  });

export const useMatch = (matchId: string) =>
  useQuery({ queryKey: ["matches", matchId], queryFn: ({ signal }) => getMatch(matchId, signal) });
