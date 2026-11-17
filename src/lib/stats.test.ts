import { describe, expect, it } from "vitest";
import type { MatchSummary } from "@/api";
import {
  aggregate,
  calendar,
  downsample,
  hourDistribution,
  kda,
  kdaDistribution,
  median,
  netPerMinute,
  recentDelta,
  rollingWinRate,
  streaks,
  winRateByDuration,
} from "./stats";

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

describe("kda", () => {
  it("applique (K + A) / max(D, 1) et gère les valeurs manquantes", () => {
    expect(kda(10, 5, 5)).toBe(3);
    expect(kda(6, 0, 2)).toBe(8);
    expect(kda(null, 1, 1)).toBeNull();
  });
  it("le KDA global utilise les sommes, pas la moyenne des ratios", () => {
    const a = aggregate([
      m({ kills: 10, deaths: 1, assists: 0 }),
      m({ kills: 0, deaths: 9, assists: 0 }),
    ]);
    expect(a.kda).toBe(1); // 10 / 10, et non (10 + 0) / 2
  });
});

describe("valeur nette par minute", () => {
  it("divise par la durée et renvoie null sans durée", () => {
    expect(netPerMinute(m({ netWorth: 36000, durationSeconds: 1800 }))).toBe(1200);
    expect(netPerMinute(m({ durationSeconds: null }))).toBeNull();
  });
});

describe("séries et écarts", () => {
  const wins = (n: number) => Array.from({ length: n }, () => m({ outcome: "win" }));
  const losses = (n: number) => Array.from({ length: n }, () => m({ outcome: "loss" }));

  it("calcule la série en cours et le record", () => {
    const list = [...wins(3), ...losses(1), ...wins(5)];
    expect(streaks(list)).toEqual({ current: { type: "win", length: 3 }, bestWin: 5 });
    expect(streaks([])).toEqual({ current: null, bestWin: 0 });
  });

  it("n'affiche la courbe glissante qu'à partir de la 5e partie", () => {
    const points = rollingWinRate([...wins(6)]);
    expect(points.slice(0, 4).every((p) => p.value === null)).toBe(true);
    expect(points[4]?.value).toBe(100);
  });

  it("compare les 20 dernières parties aux précédentes", () => {
    const recent = [...wins(15), ...losses(5)];
    const before = [...wins(5), ...losses(15)];
    const d = recentDelta([...recent, ...before]);
    expect(d?.winRate).toBe(50);
    expect(recentDelta(wins(10))).toBeNull();
  });
});

describe("distributions", () => {
  it("répartit le KDA en 7 classes avec médiane", () => {
    const d = kdaDistribution([
      m({ kills: 1, deaths: 5, assists: 0 }),
      m({ kills: 20, deaths: 1, assists: 0 }),
    ]);
    expect(d.bins).toHaveLength(7);
    expect(d.bins[0]?.count).toBe(1);
    expect(d.bins[6]?.count).toBe(1);
    expect(d.median).toBe(10.1);
  });

  it("répartit le taux de victoire par durée, n/d si vide", () => {
    const rows = winRateByDuration([
      m({ durationSeconds: 1500 }),
      m({ durationSeconds: 1500, outcome: "loss" }),
    ]);
    expect(rows[0]).toMatchObject({ matches: 2, winRate: 50 });
    expect(rows[3]).toMatchObject({ matches: 0, winRate: null });
  });

  it("construit 12 semaines en commençant le lundi, en UTC", () => {
    const weeks = calendar(
      [
        m({ playedAt: "2026-11-10T20:00:00Z" }),
        m({ playedAt: "2026-11-10T21:00:00Z", outcome: "loss" }),
      ],
      new Date("2026-11-16T12:00:00Z"),
    );
    expect(weeks).toHaveLength(12);
    expect(new Date(`${weeks[0]?.[0]?.date}T00:00:00Z`).getUTCDay()).toBe(1);
    const day = weeks.flat().find((d) => d.date === "2026-11-10");
    expect(day).toMatchObject({ count: 2, wins: 1, losses: 1 });
  });

  it("compte les heures de jeu à Paris", () => {
    const h = hourDistribution([m({ playedAt: "2026-11-10T20:00:00Z" })]);
    expect(h.counts[21]).toBe(1); // UTC+1 en novembre
    expect(h.peak).toBe(21);
  });
});

describe("utilitaires", () => {
  it("médiane et échantillonnage", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([])).toBeNull();
    const items = Array.from({ length: 500 }, (_, i) => i);
    const sample = downsample(items, 120);
    expect(sample).toHaveLength(120);
    expect(sample[0]).toBe(0);
    expect(sample.at(-1)).toBe(499);
  });
});

describe("modes", () => {
  it("répartit par mode sans mélanger type de partie et format", async () => {
    const { modeBreakdown } = await import("./stats");
    const base = (over: Partial<MatchSummary>): MatchSummary => ({
      matchId: "1",
      playedAt: "2026-11-10T12:00:00.000Z",
      heroId: 1,
      heroName: "Infernus",
      outcome: "win",
      durationSeconds: 1800,
      kills: 1,
      deaths: 1,
      assists: 1,
      netWorth: 1,
      ...over,
    });
    const { rows, unknown } = modeBreakdown([
      base({ matchMode: "ranked", gameMode: "normal" }),
      base({ matchMode: "ranked", gameMode: "normal", outcome: "loss" }),
      base({ matchMode: "unranked", gameMode: "normal" }),
      base({ matchMode: "unranked", gameMode: "street_brawl" }),
      base({ matchMode: null, gameMode: null }),
    ]);
    expect(rows.find((r) => r.key === "ranked")).toMatchObject({
      matches: 2,
      wins: 1,
      winRate: 50,
    });
    expect(rows.find((r) => r.key === "normal")?.matches).toBe(1);
    expect(rows.find((r) => r.key === "street_brawl")?.matches).toBe(1);
    expect(unknown).toBe(1);
  });
});
