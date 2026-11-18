import { useQueries, useQuery } from "@tanstack/react-query";
import { getHero, getHeroStats, getMap, listHeroes, listRanks } from "@/api";
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
 * Méta de plusieurs héros pour un widget (accueil). Aujourd'hui : UNE requête `/heroes/:id/stats` par héros, avec
 * la même clé que la fiche héros (le cache est partagé). Le back n'expose pas encore de méta groupée : le jour où
 * il le fera, seule l'implémentation de ce hook change, pas les composants.
 */
export function useHeroesMeta(heroIds: number[]) {
  const queries = useQueries({
    queries: heroIds.map((id) => ({
      queryKey: ["heroes", String(id), "stats"],
      queryFn: ({ signal }: { signal: AbortSignal }) => getHeroStats(id, signal),
    })),
  });
  return new Map(
    heroIds.map((id, i) => [
      id,
      { stats: queries[i]?.data?.stats, isPending: Boolean(queries[i]?.isPending) },
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
