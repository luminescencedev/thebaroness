import { useQuery } from "@tanstack/react-query";
import { getTrackedInsights, type TrackedInsight, type TrackedPlayer } from "@/api";
import { useSession } from "@/features/auth/useSession";
import { trackedKeys } from "./hooks";

/**
 * Cartes de la liste « Mes suivis » : UNE requête (`GET /tracked-players/insights`, v1.12.0) au lieu de deux par
 * joueur. Un suivi indisponible ne fait pas échouer la liste : sa ligne porte son propre statut et son erreur.
 * Les métadonnées (alias, note, tags) viennent toujours de `GET /tracked-players`.
 */
export function useTrackedInsights(items: TrackedPlayer[]) {
  const session = useSession();
  const query = useQuery({
    queryKey: [...trackedKeys.all, "insights", session?.user.id ?? "anon"],
    queryFn: ({ signal }) => getTrackedInsights(signal),
    enabled: session !== null && items.length > 0,
    staleTime: 60_000,
    retry: false,
  });
  const byId = new Map<string, TrackedInsight>(
    (query.data?.items ?? []).map((i) => [i.trackedPlayerId, i]),
  );
  return {
    rows: items.map((t) => ({
      tracked: t,
      insight: byId.get(t.id),
      loading: query.isPending,
    })),
    truncated: query.data?.truncated ?? false,
    isError: query.isError,
  };
}
