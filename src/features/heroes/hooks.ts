import { useQuery } from "@tanstack/react-query";
import { getHero, getHeroStats, getHeroesStats, getMap, listHeroes, listRanks } from "@/api";
import { vividColor } from "@/lib/color";

/** Le catalogue change rarement (cahier 9.2 : 24 h côté back). */
const CATALOG_STALE = 60 * 60 * 1000;

export const useHeroes = () =>
  useQuery({
    queryKey: ["heroes"],
    queryFn: ({ signal }) => listHeroes(signal),
    staleTime: CATALOG_STALE,
  });

export const useHero = (heroId: string) =>
  useQuery({
    queryKey: ["heroes", heroId],
    queryFn: ({ signal }) => getHero(heroId, signal),
    staleTime: CATALOG_STALE,
    select: (data) => ({
      ...data,
      hero: { ...data.hero, color: vividColor(data.hero.color, data.hero.role) },
    }),
  });

export const useHeroStats = (heroId: string) =>
  useQuery({
    queryKey: ["heroes", heroId, "stats"],
    queryFn: ({ signal }) => getHeroStats(heroId, signal),
  });

/**
 * Méta de plusieurs héros pour un widget (accueil) : UNE requête `GET /heroes/stats?heroIds=…` (v1.14.0) au lieu
 * d'une par héros. `isPending` vaut tant que la réponse groupée n'est pas là ; un héros absent de la réponse ou
 * sans donnée reste « n/d » (jamais 0). La fenêtre est fixée par la source (30 jours, mode normal).
 */
export function useHeroesMeta(heroIds: number[]) {
  const ids = [...new Set(heroIds)].sort((a, b) => a - b);
  const query = useQuery({
    queryKey: ["heroes", "stats-batch", ids.join(",")],
    queryFn: ({ signal }) => getHeroesStats(ids, signal),
    enabled: ids.length > 0,
    staleTime: 30 * 60_000,
  });
  const byId = new Map((query.data?.items ?? []).map((s) => [s.heroId, s]));
  return new Map(
    heroIds.map((id) => [
      id,
      { stats: byId.get(id), isPending: query.isPending && ids.length > 0 },
    ]),
  );
}

export const useRanks = () =>
  useQuery({
    queryKey: ["ranks"],
    queryFn: ({ signal }) => listRanks(signal),
    staleTime: CATALOG_STALE,
  });

export const useMap = () =>
  useQuery({
    queryKey: ["map"],
    queryFn: ({ signal }) => getMap(signal),
    staleTime: CATALOG_STALE,
  });
