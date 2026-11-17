import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { getHeroStats, type HeroSummary, type ProfileScope } from "@/api";
import { useHeroes } from "@/features/heroes/hooks";
import {
  HISTORY_CAP,
  usePlayerHeroes,
  usePlayerActivity,
  usePlayerHistory,
  usePlayerOverview,
  usePlayerRankHistory,
  usePlayerRelationships,
} from "@/features/players/hooks";
import { heroRows, type HeroRow } from "@/lib/stats";

/**
 * Données du profil pour UN scope (période + modes). Overview, héros et parties viennent du back avec
 * le même scope ; seule la courbe et l'activité exploitent les parties chargées (jusqu'à HISTORY_CAP).
 */
export function useProfileData(steamId: string, scope: ProfileScope) {
  const history = usePlayerHistory(steamId, scope);
  const overview = usePlayerOverview(steamId, scope);
  const activity = usePlayerActivity(steamId, scope);
  const rankHistory = usePlayerRankHistory(steamId, scope);
  const relationships = usePlayerRelationships(steamId, scope);
  const catalog = useHeroes();
  const playerHeroes = usePlayerHeroes(steamId, scope);

  const heroById = useMemo(() => {
    const map = new Map<number, HeroSummary>();
    catalog.data?.items.forEach((h) => map.set(h.id, h));
    return map;
  }, [catalog.data]);

  // Méta des héros les plus joués (30 jours) pour l'écart face à la méta. Échec = n/d.
  const topIds = (playerHeroes.data?.items ?? []).slice(0, 12).map((h) => h.heroId);
  const metaQueries = useQueries({
    queries: topIds.map((id) => ({
      queryKey: ["heroes", String(id), "stats"],
      queryFn: ({ signal }: { signal: AbortSignal }) => getHeroStats(id, signal),
      staleTime: 30 * 60_000,
      retry: false,
    })),
  });
  // Calcul léger : refait à chaque rendu, sans mémoïsation fragile.
  const metaWinRate = new Map<number, number | null>();
  topIds.forEach((id, i) => metaWinRate.set(id, metaQueries[i]?.data?.stats.winRate ?? null));
  const rows: HeroRow[] = heroRows(playerHeroes.data?.items ?? [], metaWinRate);
  const mainHero = rows[0] ? heroById.get(rows[0].heroId) : undefined;

  return {
    history,
    overview,
    activity,
    rankHistory,
    relationships,
    heroById,
    rows,
    mainHero,
    cap: HISTORY_CAP,
    playerHeroes,
  };
}
