import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { getHeroStats, type HeroSummary } from "@/api";
import { useHeroes } from "@/features/heroes/hooks";
import { usePlayerHeroes } from "@/features/leaderboard/hooks";
import { HISTORY_CAP, usePlayerHistory } from "@/features/players/hooks";
import { aggregate, heroRows, rolesPlayed, type HeroRow } from "@/lib/stats";

/** Tout ce que les trois onglets du profil calculent à partir de l'historique chargé. */
export function useProfileData(steamId: string) {
  const history = usePlayerHistory(steamId);
  const catalog = useHeroes();
  const playerHeroes = usePlayerHeroes(steamId);

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
  const roles = useMemo(
    () => rolesPlayed(history.matches, (id) => heroById.get(id)?.role),
    [history.matches, heroById],
  );
  const stats = useMemo(() => aggregate(history.matches), [history.matches]);
  const mainHero = rows[0] ? heroById.get(rows[0].heroId) : undefined;

  return { history, heroById, rows, roles, stats, mainHero, cap: HISTORY_CAP, playerHeroes };
}
