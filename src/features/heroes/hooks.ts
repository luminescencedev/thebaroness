import { useQuery } from "@tanstack/react-query";
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
