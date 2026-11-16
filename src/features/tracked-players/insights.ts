import { useQueries } from "@tanstack/react-query";
import { getPlayer, getPlayerMatches, type TrackedPlayer } from "@/api";

/** Pour chaque suivi : profil (pseudo, rang) et forme sur les 10 dernières parties. Échec = n/d, jamais bloquant. */
export function useTrackedInsights(items: TrackedPlayer[]) {
  const profiles = useQueries({
    queries: items.map((t) => ({
      queryKey: ["players", t.steamId],
      queryFn: ({ signal }: { signal: AbortSignal }) => getPlayer(t.steamId, signal),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const forms = useQueries({
    queries: items.map((t) => ({
      queryKey: ["players", t.steamId, "form10"],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getPlayerMatches(t.steamId, { limit: 10 }, signal),
      staleTime: 60_000,
      retry: false,
    })),
  });
  return items.map((t, i) => ({
    tracked: t,
    profile: profiles[i]?.data,
    form: forms[i]?.data?.items.map((m) => m.outcome) ?? null,
    loading: Boolean(profiles[i]?.isPending),
  }));
}
