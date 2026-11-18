import type {
  AnalyticsFilters,
  AnalyticsMatchMode,
  AnalyticsPeriod,
  BuildSort,
  HeroBuild,
  ItemPair,
  ItemStats,
} from "@/api/types";
import { heroes } from "./synthetic";
import { seeded, syntheticCatalog } from "./synthetic";

/**
 * Fixtures SYNTHETIQUES de la phase P2 (statistiques d'items, builds, paires). Elles respectent le contrat
 * OpenAPI 1.11.0 mais ne sont PAS de vraies statistiques : à ne jamais présenter comme telles.
 * Cas couverts : item sous le seuil (dernier du catalogue), vente inconnue, héros sans build ni paire.
 */

export const BELOW_THRESHOLD_ITEM = syntheticCatalog[syntheticCatalog.length - 1]!.id;
/** Dernier héros : aucun build. Avant-dernier : aucune paire connue. */
export const NO_BUILDS_HERO = heroes[heroes.length - 1]?.id ?? -1;
export const NO_PAIRS_HERO = heroes[heroes.length - 2]?.id ?? -1;

const scale = (period: AnalyticsPeriod, mode: AnalyticsMatchMode | undefined, heroId?: number) =>
  (period === "7d" ? 0.25 : 1) *
  (mode === "ranked" ? 0.6 : mode === "unranked" ? 0.4 : 1) *
  (heroId ? 0.08 : 1);

export function filtersOf(
  period: AnalyticsPeriod,
  mode: AnalyticsMatchMode | undefined,
  heroId: number | null,
): AnalyticsFilters {
  const days = period === "7d" ? 7 : 30;
  return {
    period,
    heroId,
    matchMode: mode ?? "all",
    gameMode: "normal",
    from: new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 13) + ":00:00.000Z",
  };
}

export function itemStatsFor(
  itemId: number,
  period: AnalyticsPeriod,
  mode: AnalyticsMatchMode | undefined,
  heroId?: number,
): ItemStats | null {
  const idx = syntheticCatalog.findIndex((c) => c.id === itemId);
  if (idx < 0 || itemId === BELOW_THRESHOLD_ITEM) return null;
  const r = seeded(idx * 7919 + (heroId ?? 0) * 31 + (mode === "ranked" ? 1 : mode ? 2 : 0));
  const matches = Math.round((900 + r.int(0, 9000)) * scale(period, mode, heroId));
  if (matches < 20) return null;
  const winRate = Math.round((44 + r.next() * 14) * 10) / 10;
  const wins = Math.round((matches * winRate) / 100);
  const neverSold = idx % 6 === 5;
  const sold = neverSold ? null : Math.round(matches * (0.04 + r.next() * 0.2));
  return {
    itemId,
    matches,
    wins,
    losses: matches - wins,
    winRate,
    players: Math.round(matches * (0.6 + r.next() * 0.3)),
    sold,
    sellRate: sold === null ? null : Math.round((sold / matches) * 1000) / 10,
    avgBuyTimeSeconds: 300 + r.int(0, 1500),
    avgSellTimeSeconds: sold === null ? null : 1200 + r.int(0, 1200),
  };
}

export function allItemStats(
  period: AnalyticsPeriod,
  mode: AnalyticsMatchMode | undefined,
  heroId?: number,
): ItemStats[] {
  return syntheticCatalog.flatMap((c) => {
    const s = itemStatsFor(c.id, period, mode, heroId);
    return s ? [s] : [];
  });
}

export function pairsFor(
  heroId: number,
  period: AnalyticsPeriod,
  mode: AnalyticsMatchMode | undefined,
  itemId: number | undefined,
  limit: number,
): ItemPair[] {
  if (heroId === NO_PAIRS_HERO) return [];
  const r = seeded(heroId * 104729);
  const k = scale(period, mode);
  const out: ItemPair[] = [];
  for (let a = 0; a < syntheticCatalog.length - 1; a++) {
    for (let b = a + 1; b < syntheticCatalog.length - 1; b++) {
      if ((a * 3 + b * 5 + heroId) % 7 !== 0) continue;
      const ids: [number, number] = [syntheticCatalog[a]!.id, syntheticCatalog[b]!.id];
      if (itemId !== undefined && !ids.includes(itemId)) continue;
      const matches = Math.round((60 + r.int(0, 900)) * k);
      if (matches < 20) continue;
      const winRate = Math.round((42 + r.next() * 18) * 10) / 10;
      // wins + losses peut ne pas égaler matches dans la source : on respecte ce cas.
      const wins = Math.round((matches * winRate) / 100);
      out.push({
        itemIds: ids,
        matches,
        wins,
        losses: matches - wins - (a % 5 === 0 ? 1 : 0),
        winRate,
      });
    }
  }
  return out.sort((x, y) => y.matches - x.matches).slice(0, limit);
}

const BUILD_NAMES = [
  "Burst de début de partie",
  "Tout en vitalité",
  null,
  "Late game spirit",
  "Pression de ligne",
  "Build de l'auteur",
  "Fenêtre de tir",
];

export function buildsFor(heroId: number, sort: BuildSort, limit: number): HeroBuild[] {
  if (heroId === NO_BUILDS_HERO) return [];
  const r = seeded(heroId * 6151);
  const count = Math.min(limit, BUILD_NAMES.length);
  const pool = syntheticCatalog.slice(0, -1);
  return Array.from({ length: count }, (_, n) => {
    const pickItems = (size: number, notes: boolean) =>
      Array.from({ length: size }, (_, j) => ({
        itemId: pool[(n * 5 + j * 3 + r.int(0, 3)) % pool.length]!.id,
        annotation: notes && j === 0 ? "À prendre en premier si la ligne est calme." : null,
      }));
    return {
      buildId: heroId * 1000 + n,
      heroId,
      name: BUILD_NAMES[n] ?? null,
      description: n % 2 === 0 ? "Build synthétique de démonstration." : null,
      authorSteamId: n === 2 ? null : String(76561198000000000n + BigInt(n + 10)),
      language: 0,
      version: 1 + (n % 3),
      publishedAt: new Date(Date.now() - (60 + n * 9) * 86_400_000).toISOString(),
      updatedAt: new Date(Date.now() - (2 + n * 5) * 86_400_000).toISOString(),
      favorites: sort === "favorites" ? (n === 4 ? 0 : 900 - n * 110) : null,
      weeklyFavorites: sort === "weekly_favorites" ? 120 - n * 15 : null,
      categories: [
        { name: "Early Game", description: null, items: pickItems(3, true) },
        { name: "Mid Game", description: "Après le premier objectif.", items: pickItems(4, false) },
        {
          name: n % 2 ? "Plan B contre les tanks" : "Late Game",
          description: null,
          items: pickItems(4, false),
        },
        ...(n === 1 ? [{ name: null, description: null, items: pickItems(2, false) }] : []),
      ],
    };
  });
}
