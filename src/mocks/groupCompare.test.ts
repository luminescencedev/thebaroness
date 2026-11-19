import { describe, expect, it } from "vitest";
import type { Group } from "@/api/types";
import { SCENARIOS } from "./scenarios";
import { compareResponse, groupsWithMembers, unavailableReason } from "./groupCompare";
import { GROUP_PLAYERS, memberStats, seasonAt, syntheticMatches } from "./synthetic";

const p = GROUP_PLAYERS[0]!;
const all = syntheticMatches[p.steamId] ?? [];
const group = (steamIds: string[]): Group => ({
  id: "607f1f77bcf86cd799439021",
  name: "G",
  steamIds,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
});

describe("mock des groupes : mêmes règles que le back v1.15.0", () => {
  it("saison : pas de période précédente ni d'écart, jamais 0 par défaut", () => {
    const m = memberStats(p, all, "season");
    expect(m.previous).toBeNull();
    expect(m.deltaVsPrevious).toBeNull();
  });

  it("écart null sous 5 parties de chaque côté, calculé sinon", () => {
    const m = memberStats(p, all, "30d");
    expect(m.previous).not.toBeNull();
    const d = m.deltaVsPrevious!;
    const enough = m.matches >= 5 && m.previous!.matches >= 5;
    expect(d.winRate === null).toBe(!enough || m.winRate === null || m.previous!.winRate === null);
    expect(d.matches).toBe(m.matches - m.previous!.matches);
  });

  it("rankDelta : seulement la dernière saison ; les points portent leur saison", () => {
    const m = memberStats(p, all, "30d");
    const seasons = new Set(m.rankHistory.map((x) => x.season));
    expect(seasons.has(1) && seasons.has(2)).toBe(true); // 30 jours à partir du 16/11 chevauchent le 05/11
    const last = m.rankHistory.at(-1)!;
    const same = m.rankHistory.filter((x) => x.season === last.season);
    expect(m.rankDelta).toBe(same.at(-1)!.score - same[0]!.score);
    expect(seasonAt("2026-11-05T19:59:59.000Z")).toBe(1);
    expect(seasonAt("2026-11-05T20:00:00.000Z")).toBe(2);
  });

  it("filtre de mode : les parties au mode inconnu ne comptent que sous « tous » et sont dénombrées", () => {
    const unknown = all.map((x, i) => (i === 0 ? { ...x, matchMode: null, gameMode: null } : x));
    const allModes = memberStats(p, unknown, "30d");
    const ranked = memberStats(p, unknown, "30d", { matchMode: "ranked" });
    expect(allModes.excludedUnknownModeMatches).toBe(0);
    expect(ranked.matches).toBeLessThanOrEqual(allModes.matches);
    expect(ranked.excludedUnknownModeMatches).toBeGreaterThanOrEqual(0);
  });

  it("membres indisponibles nommés avec leur raison, les autres restent", () => {
    const g = group([
      p.steamId,
      SCENARIOS.steamIdUnavailable,
      SCENARIOS.steamIdRateLimited,
      "76561198099999999",
    ]);
    const { body } = compareResponse(
      g,
      { period: "30d", gameMode: "all", matchMode: "all" },
      { pairs: false },
    );
    expect(body.unavailable).toEqual([
      { steamId: SCENARIOS.steamIdUnavailable, reason: "provider_error" },
      { steamId: SCENARIOS.steamIdRateLimited, reason: "rate_limited" },
      { steamId: "76561198099999999", reason: "not_found" },
    ]);
    expect(body.members.map((m) => m.steamId)).toEqual([p.steamId]);
    expect(unavailableReason(p.steamId)).toBeNull();
  });

  it("paires : « même équipe » seulement, membres absents listés comme non évalués, jamais comptés à 0", () => {
    const ids = GROUP_PLAYERS.slice(0, 3).map((x) => x.steamId);
    const g = group([...ids, SCENARIOS.steamIdUnavailable]);
    const { body } = compareResponse(
      g,
      { period: "30d", gameMode: "all", matchMode: "all" },
      { pairs: true },
    );
    const pairs = body.pairs!;
    expect(pairs.scope).toMatchObject({ relation: "same_team", partyConfirmed: false });
    expect(pairs.coverage.membersMissing).toEqual([SCENARIOS.steamIdUnavailable]);
    expect(pairs.coverage.pairsEvaluated).toBe(3); // 3 membres présents : 3 paires, pas 6
    expect(pairs.items.every((i) => !i.steamIds.includes(SCENARIOS.steamIdUnavailable))).toBe(true);
    const m = pairs.items.map((i) => i.together.matches);
    expect([...m].sort((a, b) => b - a)).toEqual(m);
  });

  it("sans include=pairs : pas de clé pairs", () => {
    const { body } = compareResponse(
      group(GROUP_PLAYERS.slice(0, 2).map((x) => x.steamId)),
      { period: "30d", gameMode: "all", matchMode: "all" },
      { pairs: false },
    );
    expect("pairs" in body).toBe(false);
  });

  it("identités : repli sur le SteamID64 quand le profil n'est pas résolu", () => {
    const { items, membersCoverage } = groupsWithMembers([group([p.steamId, "76561198099999999"])]);
    const [a, b] = items[0]!.members!;
    expect(a).toMatchObject({ displayName: p.displayName, resolved: true });
    expect(b).toMatchObject({ displayName: "76561198099999999", resolved: false });
    expect(membersCoverage).toMatchObject({ requested: 2, resolved: 1 });
  });
});
