import { useMemo } from "react";
import type { HeroSummary, ProfileScope } from "@/api";
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
 * le même scope. La méta des héros (`globalMeta`, `winRateVsMeta`, `metaContext`) arrive DANS `/players/:id/heroes` :
 * plus aucune lecture de méta par héros côté front.
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

  const rows: HeroRow[] = useMemo(
    () => heroRows(playerHeroes.data?.items ?? []),
    [playerHeroes.data],
  );
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
    /** Périmètre de la méta, null si indisponible ou si le back est plus ancien que la v1.12.0. */
    metaContext: playerHeroes.data?.metaContext ?? null,
  };
}
