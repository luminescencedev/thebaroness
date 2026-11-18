import { describe, expect, it } from "vitest";
import type { MatchSummary } from "@/api";
import { calendarFromDays, downsample, heroRows, kda, kdaRatio, netPerMinute } from "./stats";

const m = (over: Partial<MatchSummary> = {}): MatchSummary => ({
  matchId: "1",
  playedAt: "2026-11-10T12:00:00.000Z",
  heroId: 1,
  heroName: "Infernus",
  outcome: "win",
  durationSeconds: 1800,
  kills: 10,
  deaths: 5,
  assists: 5,
  netWorth: 36000,
  ...over,
});

describe("kdaRatio : une seule formule", () => {
  it("brut pour les comparaisons, arrondi pour l'affichage", () => {
    expect(kdaRatio(7, 3, 2)).toBe(3);
    expect(kdaRatio(10, 0, 3)).toBe(13);
    expect(kdaRatio(4, 3, 0)).toBeCloseTo(1.3333, 4);
    expect(kda(4, 3, 0)).toBe(1.33);
    expect(kdaRatio(null, 3, 0)).toBeNull();
  });
});

describe("kda", () => {
  it("applique (K + A) / max(D, 1) et gère les valeurs manquantes", () => {
    expect(kda(10, 5, 5)).toBe(3);
    expect(kda(6, 0, 2)).toBe(8);
    expect(kda(null, 1, 1)).toBeNull();
  });
});

describe("valeur nette par minute", () => {
  it("divise par la durée et renvoie null sans durée", () => {
    expect(netPerMinute(m({ netWorth: 36000, durationSeconds: 1800 }))).toBe(1200);
    expect(netPerMinute(m({ durationSeconds: null }))).toBeNull();
  });
});

describe("heroRows", () => {
  const base = { heroName: "Infernus", heroImageUrl: null, matches: 10, wins: 5, losses: 5 };
  it("lit l'écart et la méta fournis par le back, sans les recalculer", () => {
    const rows = heroRows([
      {
        ...base,
        heroId: 1,
        winRate: 55,
        globalMeta: { matches: 1000, winRate: 50.5, pickRate: 3 },
        winRateVsMeta: 4.5,
      },
      { ...base, heroId: 2, winRate: null, globalMeta: null, winRateVsMeta: null },
      { ...base, heroId: 3, winRate: 40, matches: 3 }, // back plus ancien : champs absents
    ] as never);
    expect(rows[0]).toMatchObject({ metaWinRate: 50.5, delta: 4.5, few: false });
    expect(rows[1]).toMatchObject({ metaWinRate: null, delta: null });
    expect(rows[2]).toMatchObject({ metaWinRate: null, delta: null, few: true });
  });
});

describe("utilitaires", () => {
  it("échantillonnage", () => {
    const items = Array.from({ length: 500 }, (_, i) => i);
    const sample = downsample(items, 120);
    expect(sample).toHaveLength(120);
    expect(sample[0]).toBe(0);
    expect(sample.at(-1)).toBe(499);
  });
});

describe("calendarFromDays", () => {
  it("aligne les jours du back sur une grille lundi en premier, un jour absent vaut 0", () => {
    const days = Array.from({ length: 84 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 10, 16) - (83 - i) * 86400000).toISOString().slice(0, 10);
      return {
        date: d,
        matches: i === 83 ? 3 : 0,
        wins: i === 83 ? 2 : 0,
        losses: i === 83 ? 1 : 0,
      };
    });
    const weeks = calendarFromDays(days, 12);
    expect(weeks).toHaveLength(12);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    const flat = weeks.flat();
    expect(flat.find((d) => d.date === "2026-11-16")).toMatchObject({
      count: 3,
      wins: 2,
      losses: 1,
    });
    expect(new Date(`${weeks[0]![0]!.date}T00:00:00Z`).getUTCDay()).toBe(1);
  });
});
