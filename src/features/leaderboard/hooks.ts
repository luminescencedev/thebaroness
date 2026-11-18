import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, getMatch, type LeaderboardRegion } from "@/api";

export const useLeaderboard = (region: LeaderboardRegion) =>
  useQuery({
    queryKey: ["leaderboard", region],
    queryFn: ({ signal }) => getLeaderboard(region, signal),
    // Premier appel à froid : jusqu'à ~10 s côté back (résolution des rangs). Le classement change peu :
    // revenir sur une région déjà vue ne doit pas relancer ce coût.
    staleTime: 5 * 60_000,
    // Pas de réessai automatique : un 429 ou un 502 se rejoue à la main, sans consommer le quota du fournisseur.
    retry: false,
    // Rangs incomplets : le back refait sa copie après environ 1 min. On relit à ce rythme, pas plus vite.
    refetchInterval: (q) => (q.state.data?.meta.isPartial ? 60_000 : false),
  });

export const useMatch = (matchId: string) =>
  useQuery({ queryKey: ["matches", matchId], queryFn: ({ signal }) => getMatch(matchId, signal) });
