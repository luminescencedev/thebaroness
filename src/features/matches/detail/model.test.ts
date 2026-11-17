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

describe("résultat", () => {
  it("vainqueur inconnu : aucune équipe perdante, même si les outcome disent autre chose", () => {
    const m = match([P()], [P()], null);
    expect(resultOf(m, "amber")).toBe("unknown");
    expect(resultOf(m, "sapphire")).toBe("unknown");
  });
  it("suit winningSide", () => {
    const m = match([P()], [P()], "sapphire");
    expect(resultOf(m, "sapphire")).toBe("win");
    expect(resultOf(m, "amber")).toBe("loss");
  });
});

describe("totaux", () => {
  it("jamais de somme partielle, et 0 reste 0", () => {
    expect(teamTotal([P({ kills: 3 }), P({ kills: null })], (p) => p.kills)).toMatchObject({
      value: null,
      known: 1,
      of: 2,
      complete: false,
    });
    expect(teamTotal([P({ kills: 0 }), P({ kills: 2 })], (p) => p.kills).value).toBe(2);
  });
});

describe("tri et sélection", () => {
  const board = buildBoard(
    match(
      [
        P({ displayName: "a", netWorth: 100, kills: 1, deaths: 1, assists: 1 }),
        P({ displayName: "b", netWorth: null, kills: null }),
        P({ displayName: "c", netWorth: 300, kills: 9, deaths: 0, assists: 0 }),
        P({ displayName: "d", netWorth: 200, stats: { playerDamage: 50 } as MatchPlayer["stats"] }),
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

describe("participation", () => {
  it("valeur du back, sinon calcul sur éliminations d'équipe complètes", () => {
    const b = buildBoard(
      match(
        [P({ kills: 5, assists: 5 }), P({ kills: 5, assists: 0, killParticipation: 42 })],
        [P()],
      ),
    )[0]!;
    expect(b.players[0]?.kp).toBe(100);
    expect(b.players[1]?.kp).toBe(42);
  });
});
