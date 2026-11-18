import { describe, expect, it } from "vitest";
import type { GroupHighlight, GroupMemberStats } from "@/api";
import { groupHighlights } from "@/mocks/groupHighlights";
import { highlightCards, sortMembers } from "./compare";

const member = (o: Partial<GroupMemberStats>): GroupMemberStats => ({
  steamId: "76561198000000001",
  displayName: "A",
  avatarUrl: null,
  rank: null,
  matches: 10,
  wins: 5,
  losses: 5,
  winRate: 50,
  kda: 2,
  longestWinStreak: 2,
  bestMatch: null,
  rankHistory: [],
  currentRankScore: null,
  rankDelta: null,
  ...o,
});

describe("tri local des membres : valeurs du back", () => {
  const a = member({ steamId: "1", displayName: "A", currentRankScore: 30, rankDelta: 2 });
  const b = member({ steamId: "2", displayName: "B", currentRankScore: 40, rankDelta: null });
  const c = member({ steamId: "3", displayName: "C", currentRankScore: null, rankDelta: 5 });
  it("rang : score du back, inconnu en dernier ; progression : delta du back, null en dernier", () => {
    expect(sortMembers([a, b, c], "rank").map((m) => m.displayName)).toEqual(["B", "A", "C"]);
    expect(sortMembers([a, b, c], "climb").map((m) => m.displayName)).toEqual(["C", "A", "B"]);
  });
  it("ex æquo départagés par nom (tri d'affichage seulement)", () => {
    const x = member({ steamId: "1", displayName: "Zed", wins: 3 });
    const y = member({ steamId: "2", displayName: "Abel", wins: 3 });
    expect(sortMembers([x, y], "wins").map((m) => m.displayName)).toEqual(["Abel", "Zed"]);
  });
});

describe("titres de la période : le back décide, le front formate", () => {
  const m1 = member({ steamId: "1", displayName: "A", matches: 12, winRate: 60 });
  const m2 = member({ steamId: "2", displayName: "B", matches: 12, winRate: 60 });
  const h = (over: Partial<GroupHighlight>): GroupHighlight => ({
    key: "best_win_rate",
    steamIds: [],
    value: null,
    matchId: null,
    eligibleMembers: 2,
    minMatches: 5,
    ...over,
  });

  it("tous les ex æquo sont conservés dans l'ordre du back", () => {
    const [card] = highlightCards([h({ steamIds: ["1", "2"], value: 60 })], [m1, m2], undefined);
    expect(card?.members.map((m) => m.displayName)).toEqual(["A", "B"]);
    expect(card?.value).toBe("60 %");
    expect(card?.detail).toBe("12 parties");
  });
  it("personne d'éligible : aucune carte, rien d'inventé", () => {
    expect(highlightCards([h({})], [m1, m2], undefined)).toEqual([]);
    expect(highlightCards(undefined, [m1, m2], undefined)).toEqual([]);
  });
  it("progression : libellé et sous-rangs depuis rankHistory", () => {
    const climber = member({
      steamId: "1",
      rankHistory: [
        { at: "2026-11-01T00:00:00Z", score: 30 },
        { at: "2026-11-10T00:00:00Z", score: 33 },
      ],
      rankDelta: 3,
    });
    const [card] = highlightCards(
      [h({ key: "biggest_climb", steamIds: ["1"], value: 3, minMatches: 0 })],
      [climber],
      [{ tier: 4, name: "Archon" }] as never,
    );
    expect(card?.value).toBe("+3 sous-rangs");
    expect(card?.detail).toBe("Archon 6 à Rang 5 3");
  });
});

describe("mock : mêmes règles que le back (seuil, strictement positif, ex æquo)", () => {
  it("seuil de 5 parties, valeur strictement positive, tous les ex æquo", () => {
    const few = member({
      steamId: "1",
      matches: 3,
      winRate: 100,
      kda: 9,
      wins: 0,
      longestWinStreak: 0,
    });
    const a = member({
      steamId: "2",
      matches: 8,
      winRate: 55,
      kda: 3,
      wins: 4,
      longestWinStreak: 2,
    });
    const b = member({
      steamId: "3",
      matches: 9,
      winRate: 55,
      kda: 2,
      wins: 4,
      longestWinStreak: 0,
    });
    const hs = Object.fromEntries(groupHighlights([few, a, b]).map((x) => [x.key, x]));
    expect(hs.best_win_rate).toMatchObject({ steamIds: ["2", "3"], value: 55, eligibleMembers: 2 });
    expect(hs.best_kda?.steamIds).toEqual(["2"]); // « few » (9) est sous le seuil
    expect(hs.most_wins?.steamIds).toEqual(["2", "3"]);
    expect(hs.longest_win_streak?.steamIds).toEqual(["2"]);
    expect(groupHighlights([few]).find((x) => x.key === "most_wins")).toMatchObject({
      steamIds: [],
      value: null,
    });
  });
});
