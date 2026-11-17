import { describe, expect, it } from "vitest";
import type { MatchSummary } from "@/api";
import { overviewOf, selectMatches, summarize } from "./profileV2";

const base = (o: Partial<MatchSummary>): MatchSummary => ({
  matchId: "1",
  playedAt: "2026-11-15T12:00:00.000Z",
  heroId: 1,
  heroName: "H",
  outcome: "win",
  durationSeconds: 1800,
  kills: 10,
  deaths: 2,
  assists: 8,
  netWorth: 36000,
  matchMode: "unranked",
  gameMode: "normal",
  ...o,
});
const f = (o = {}) => ({
  period: "30d" as const,
  gameMode: "all" as const,
  matchMode: "all" as const,
  heroId: null,
  outcome: "all" as const,
  ...o,
});

describe("règles du back reproduites par le mock", () => {
  it("KDA sur le sous-ensemble complet et valeur nette par minute en moyenne de ratios", () => {
    const s = summarize([
      base({ matchId: "1", netWorth: 36000, durationSeconds: 1800 }), // 1200 / min
      base({ matchId: "2", netWorth: 10000, durationSeconds: 600, kills: null }), // 1000 / min, KDA exclu
    ]);
    expect(s.kdaSampleSize).toBe(1);
    expect(s.kda).toBe(9); // (10 + 8) / 2
    expect(s.avgNetWorthPerMinute).toBe(1100); // moyenne des ratios, pas 46000 / 40
    expect(s.netWorthPerMinuteSampleSize).toBe(2);
  });

  it("une partie au mode inconnu n'est retenue que sous « tous » et est signalée", () => {
    const list = [base({ matchId: "1" }), base({ matchId: "2", gameMode: null, matchMode: null })];
    expect(selectMatches(list, f({ gameMode: "normal" }))).toHaveLength(1);
    const all = overviewOf(list, f());
    expect(all.summary.matches).toBe(2);
    expect(all.coverage.unknownModeMatches).toBe(1);
    expect(all.coverage.notes).toContain("unknown_mode_included");
    expect(all.modes.reduce((s, m) => s + m.matches, 0)).toBe(1);
    const filtered = overviewOf(list, f({ matchMode: "unranked" }));
    expect(filtered.coverage.excludedUnknownMode).toBe(1);
    expect(filtered.coverage.notes).toContain("unknown_mode_excluded");
  });

  it("aucune partie : compteurs à 0, ratios null", () => {
    const o = overviewOf([], f());
    expect(o.summary).toMatchObject({ matches: 0, winRate: null, kda: null, lastMatchAt: null });
    expect(o.coverage.observedFrom).toBeNull();
  });
});
