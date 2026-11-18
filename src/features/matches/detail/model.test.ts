import { describe, expect, it } from "vitest";
import type { MatchDetail, MatchPlayer } from "@/api";
import { TEAM_META } from "@/lib/teams";
import {
  buildBoard,
  defaultSelection,
  purchaseTimeline,
  resultOf,
  sortPlayers,
  teamTotal,
} from "./model";

const P = (o: Partial<MatchPlayer> = {}): MatchPlayer => ({
  steamId: null,
  displayName: "x",
  heroId: 1,
  heroName: "H",
  heroImageUrl: null,
  level: 20,
  kills: 1,
  deaths: 1,
  assists: 1,
  netWorth: 100,
  lastHits: 1,
  denies: 0,
  ...o,
});

const match = (
  a: MatchPlayer[],
  b: MatchPlayer[],
  winningSide: MatchDetail["winningSide"] = "amber",
): MatchDetail => ({
  matchId: "1",
  playedAt: null,
  durationSeconds: 600,
  winningSide,
  teams: [
    { side: "sapphire", outcome: "loss", players: b },
    { side: "amber", outcome: "win", players: a },
  ],
});

describe("équipes", () => {
  it("nomme Hidden King et Archmother, identifiants techniques inchangés", () => {
    expect(TEAM_META.amber.label).toBe("Hidden King");
    expect(TEAM_META.sapphire.label).toBe("Archmother");
  });
  it("range toujours Hidden King puis Archmother", () => {
    expect(buildBoard(match([P()], [P()])).map((t) => t.side)).toEqual(["amber", "sapphire"]);
  });
});

describe("résultat (valeur du back)", () => {
  const teamOf = (m: MatchDetail, side: "amber" | "sapphire") =>
    m.teams.find((t) => t.side === side)!;
  it("vainqueur inconnu : aucune équipe perdante, même si les outcome disent autre chose", () => {
    const m = match([P()], [P()], null);
    for (const t of m.teams) t.result = null;
    expect(resultOf(m, teamOf(m, "amber"))).toBe("unknown");
    expect(resultOf(m, teamOf(m, "sapphire"))).toBe("unknown");
    expect(buildBoard(m).map((t) => t.result)).toEqual(["unknown", "unknown"]);
  });
  it("lit `result` quand le back le fournit", () => {
    const m = match([P()], [P()], "sapphire");
    teamOf(m, "sapphire").result = "win";
    teamOf(m, "amber").result = "loss";
    expect(buildBoard(m).map((t) => t.result)).toEqual(["loss", "win"]);
  });
  it("back plus ancien (pas de `result`) : repli sur winningSide, jamais sur outcome", () => {
    const m = match([P()], [P()], "sapphire");
    expect(resultOf(m, teamOf(m, "sapphire"))).toBe("win");
    expect(resultOf(m, teamOf(m, "amber"))).toBe("loss");
    const unknown = match([P()], [P()], null);
    expect(resultOf(unknown, teamOf(unknown, "amber"))).toBe("unknown");
  });
});

describe("totaux (valeur du back)", () => {
  const board = (totals: Record<string, number | null>, known: Record<string, number>) => {
    const m = match([P(), P()], [P()]);
    const amber = m.teams.find((t) => t.side === "amber")!;
    amber.totals = totals as never;
    amber.totalsCoverage = { players: 2, knownPlayers: known };
    return buildBoard(m)[0]!;
  };
  it("jamais de somme partielle, et 0 reste 0", () => {
    expect(teamTotal(board({ kills: null }, { kills: 1 }), "kills")).toMatchObject({
      value: null,
      known: 1,
      of: 2,
      complete: false,
    });
    expect(teamTotal(board({ kills: 0 }, { kills: 2 }), "kills")).toMatchObject({
      value: 0,
      complete: true,
    });
  });
  it("back plus ancien : pas de total, jamais une somme recalculée", () => {
    const t = teamTotal(buildBoard(match([P({ kills: 3 }), P({ kills: 4 })], [P()]))[0]!, "kills");
    expect(t).toMatchObject({ value: null, complete: false });
  });
});

describe("valeurs du back lues telles quelles", () => {
  it("KDA, participation et rang de souls ne sont pas recalculés", () => {
    const b = buildBoard(
      match(
        [
          P({
            kills: 10,
            deaths: 0,
            assists: 0,
            kda: 7.77,
            killParticipation: 12.5,
            netWorthRank: 3,
          }),
        ],
        [P()],
      ),
    )[0]!.players[0]!;
    expect(b.kda).toBe(7.77);
    expect(b.kp).toBe(12.5);
    expect(b.netRank).toBe(3);
  });
  it("valeurs absentes : null, jamais calculé en repli", () => {
    const b = buildBoard(match([P({ kills: 10, deaths: 2, assists: 4 })], [P()]))[0]!.players[0]!;
    expect(b).toMatchObject({ kda: null, kp: null, netRank: null });
  });
});

describe("tri et sélection", () => {
  const board = buildBoard(
    match(
      [
        P({ displayName: "a", netWorth: 100, kda: 2 }),
        P({ displayName: "b", netWorth: null, kda: null }),
        P({ displayName: "c", netWorth: 300, kda: 9 }),
        P({
          displayName: "d",
          netWorth: 200,
          kda: 1,
          stats: { playerDamage: 50 } as MatchPlayer["stats"],
        }),
      ],
      [P()],
    ),
  )[0]!;
  it("valeurs inconnues en dernier, clés stables", () => {
    const net = sortPlayers(board.players, "net");
    expect(net.map((b) => b.player.displayName)).toEqual(["c", "d", "a", "b"]);
    expect(net.map((b) => b.key).sort()).toEqual(board.players.map((b) => b.key).sort());
    expect(sortPlayers(board.players, "damage")[0]?.player.displayName).toBe("d");
    expect(sortPlayers(board.players, "kda").at(-1)?.player.displayName).toBe("b");
  });
  it("MVP officiel d'abord, sinon plus forte valeur nette, sinon premier", () => {
    expect(defaultSelection([board])).toBe("amber:2");
    const withMvp = buildBoard(match([P({ netWorth: 5 }), P({ mvpRank: 1, netWorth: 1 })], [P()]));
    expect(defaultSelection(withMvp)).toBe("amber:1");
    const none = buildBoard(
      match([P({ netWorth: null }), P({ netWorth: null })], [P({ netWorth: null })]),
    );
    expect(defaultSelection(none)).toBe("amber:0");
  });
});

describe("achats", () => {
  it("heure inconnue en fin, revente conservée, catalogue absent toléré", () => {
    const t = purchaseTimeline(
      [
        { itemId: 1, atSeconds: null, soldAtSeconds: null },
        { itemId: 2, atSeconds: 90, soldAtSeconds: 400 },
        { itemId: 3, atSeconds: 30, soldAtSeconds: null },
      ],
      undefined,
    );
    expect(t?.map((p) => p.itemId)).toEqual([3, 2, 1]);
    expect(t?.[1]?.soldAtSeconds).toBe(400);
    expect(t?.every((p) => p.catalog === null)).toBe(true);
    expect(purchaseTimeline(null, undefined)).toBeNull();
  });
});
