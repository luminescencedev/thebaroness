import { describe, expect, it } from "vitest";
import type { CatalogItem, MatchDetail, MatchPlayer, MatchSummary } from "@/api/types";
import { enrichMatch } from "./matchModel";

const p = (o: Partial<MatchPlayer>): MatchPlayer => ({
  steamId: null,
  displayName: "x",
  heroId: 1,
  heroName: "H",
  heroImageUrl: null,
  level: 20,
  kills: 5,
  deaths: 5,
  assists: 5,
  netWorth: 30000,
  lastHits: 100,
  denies: 1,
  ...o,
});

const summary: MatchSummary = {
  matchId: "1",
  playedAt: "2026-01-01T00:00:00Z",
  heroId: 7,
  heroName: "Me",
  outcome: "win",
  durationSeconds: 1200,
  kills: 10,
  deaths: 2,
  assists: 10,
  netWorth: 50000,
};
const me = p({
  steamId: "42",
  heroId: 7,
  kills: 10,
  deaths: 2,
  assists: 10,
  netWorth: 50000,
  lastHits: 200,
});
const detail = (self: MatchPlayer): MatchDetail => ({
  matchId: "1",
  playedAt: summary.playedAt,
  durationSeconds: 1200,
  winningSide: "amber",
  teams: [
    { side: "amber", outcome: "win", players: [self, p({ kills: 10 })] },
    { side: "sapphire", outcome: "loss", players: [p({ kills: 3 })] },
  ],
});

describe("enrichMatch", () => {
  it("calcule CS par minute, KP et position sur les données réelles du détail", () => {
    const e = enrichMatch(summary, detail(me), "42");
    expect(e.self?.isSelf).toBe(true);
    expect(e.cs).toBe(200);
    expect(e.csPerMin).toBeCloseTo(10);
    expect(e.kp).toBeCloseTo((20 / 20) * 100);
    expect(e.netPosition).toEqual({ rank: 1, of: 3 });
    expect(e.badges.map((b) => b.id)).toEqual(["net-1", "kda-1"]);
  });

  it("laisse null ce que le back ne livre pas : HS et build ne valent jamais 0", () => {
    const e = enrichMatch(summary, detail(me), "42");
    expect(e.hsPct).toBeNull();
    expect(e.items).toBeNull();
  });

  it("ne donne ni position ni badge de valeur nette si une valeur nette manque", () => {
    const e = enrichMatch(summary, detail({ ...me, netWorth: null }), "42");
    expect(e.netPosition).toBeNull();
    expect(e.badges.map((b) => b.id)).not.toContain("net-1");
  });

  it("retrouve le joueur par héros et K/D/A sans SteamID", () => {
    const e = enrichMatch(summary, detail({ ...me, steamId: null }));
    expect(e.self?.heroId).toBe(7);
  });

  describe("données du back v1.10.0", () => {
    const item = (
      id: number,
      name: string,
      slot: CatalogItem["slot"],
      tier: number,
    ): CatalogItem => ({
      id,
      className: name,
      name,
      type: "upgrade",
      slot,
      tier,
      cost: 800,
      isActive: false,
      shopable: true,
      disabled: false,
      heroIds: [],
      componentIds: [],
      imageUrl: null,
    });
    const catalog = new Map([
      [1, item(1, "Late", "spirit", 3)],
      [2, item(2, "Early", "weapon", 1)],
    ]);
    const rich = {
      ...me,
      killParticipation: 61.5,
      mvpRank: 1,
      stats: { heroCritRate: 33.3, playerDamage: 100 } as MatchPlayer["stats"],
      finalItemIds: [1, 2, 999],
      purchases: [
        { itemId: 1, atSeconds: 500, soldAtSeconds: null },
        { itemId: 2, atSeconds: 60, soldAtSeconds: null },
      ],
    };

    it("résout le build avec le catalogue, dans l'ordre d'achat, sans inventer d'objet inconnu", () => {
      const e = enrichMatch(summary, detail(rich), "42", catalog);
      expect(e.items?.map((i) => i.name)).toEqual(["Early", "Late"]);
    });

    it("sans catalogue ou sans objets du back : build null (n/d), jamais un faux build", () => {
      expect(enrichMatch(summary, detail(rich), "42", null).items).toBeNull();
      expect(enrichMatch(summary, detail(me), "42", catalog).items).toBeNull();
    });

    it("prend la participation du back, les tirs critiques comme HS, et le MVP de Valve", () => {
      const e = enrichMatch(summary, detail(rich), "42", catalog);
      expect(e.kp).toBe(61.5);
      expect(e.hsPct).toBe(33.3);
      expect(e.mvpRank).toBe(1);
      expect(e.badges.map((b) => b.id)).toContain("mvp");
    });
  });
});
