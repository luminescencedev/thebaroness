import { describe, expect, it } from "vitest";
import {
  ApiError,
  getPlayerHeroes,
  getPlayerMatches,
  getPlayerOverview,
  type MatchSummary,
  type ProfileScope,
} from "@/api";
import { SCENARIOS } from "@/mocks/scenarios";

const ID = SCENARIOS.steamIdFull;
const scope = (p: Partial<ProfileScope> = {}): ProfileScope => ({
  period: "30d",
  gameMode: "all",
  matchMode: "all",
  ...p,
});

async function allMatches(params: Parameters<typeof getPlayerMatches>[1]) {
  const out: MatchSummary[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const page = await getPlayerMatches(ID, { ...params, limit: 10, cursor });
    out.push(...page.items);
    cursor = page.nextCursor ?? undefined;
    pages += 1;
  } while (cursor);
  return { out, pages };
}

describe("overview v1.9.0", () => {
  it("agrège la période exacte et respecte la taille d'échantillon", async () => {
    const o = await getPlayerOverview(ID, scope());
    expect(o.filters).toEqual(scope());
    expect(o.summary.matches).toBe(o.summary.wins + o.summary.losses);
    expect(o.summary.kdaSampleSize).toBe(o.summary.matches);
    expect(o.coverage.includedMatches).toBe(o.summary.matches);
    // somme des modes + modes inconnus = total
    const inModes = o.modes.reduce((s, m) => s + m.matches, 0);
    expect(inModes + o.coverage.unknownModeMatches).toBe(o.summary.matches);
  });

  it("7 jours, 30 jours et saison donnent des périmètres emboîtés", async () => {
    const [d7, d30, season] = await Promise.all(
      (["7d", "30d", "season"] as const).map((period) => getPlayerOverview(ID, scope({ period }))),
    );
    expect(d7!.summary.matches).toBeLessThan(d30!.summary.matches);
    expect(season!.coverage.requestedFrom).toBe("2026-11-05T20:00:00.000Z");
    expect(d7!.coverage.requestedFrom).not.toBeNull();
  });

  it("gameMode et matchMode sont deux axes indépendants", async () => {
    const normal = await getPlayerOverview(ID, scope({ gameMode: "normal" }));
    const ranked = await getPlayerOverview(ID, scope({ matchMode: "ranked" }));
    const both = await getPlayerOverview(ID, scope({ gameMode: "normal", matchMode: "ranked" }));
    // « normal » contient des classées ET des non classées
    expect(new Set(normal.modes.map((m) => m.matchMode))).toEqual(new Set(["ranked", "unranked"]));
    expect(ranked.modes.every((m) => m.matchMode === "ranked")).toBe(true);
    expect(both.modes).toHaveLength(1);
    expect(both.summary.matches).toBeLessThan(normal.summary.matches);
    const sb = await getPlayerOverview(ID, scope({ gameMode: "street_brawl" }));
    expect(sb.modes.every((m) => m.gameMode === "street_brawl")).toBe(true);
  });

  it("un filtre sans résultat renvoie des compteurs à 0 et des ratios null, jamais 0 inventé", async () => {
    const o = await getPlayerOverview(
      SCENARIOS.steamIdFull,
      scope({ period: "7d", matchMode: "ranked", gameMode: "street_brawl" }),
    );
    expect(o.summary.matches).toBe(0);
    expect(o.summary.winRate).toBeNull();
    expect(o.summary.kda).toBeNull();
    expect(o.summary.avgNetWorthPerMinute).toBeNull();
    expect(o.topHeroes).toEqual([]);
  });

  it("valeur inconnue : 400", async () => {
    const e = await getPlayerOverview(ID, scope({ period: "1y" as never })).catch(
      (x: unknown) => x,
    );
    expect(e).toBeInstanceOf(ApiError);
    expect((e as ApiError).status).toBe(400);
  });
});

describe("parties filtrées par le serveur", () => {
  it("filtre avant la pagination, sur toute la sélection", async () => {
    const { out, pages } = await allMatches({ period: "30d", outcome: "loss" });
    expect(pages).toBeGreaterThan(1);
    expect(out.every((m) => m.outcome === "loss")).toBe(true);
    const overview = await getPlayerOverview(ID, scope());
    expect(out.length).toBe(overview.summary.losses);
  });

  it("combine héros, résultat, période et modes", async () => {
    const first = (await getPlayerMatches(ID, { period: "30d", limit: 50 })).items[0]!;
    const { out } = await allMatches({
      period: "30d",
      heroId: first.heroId,
      outcome: first.outcome,
      gameMode: "normal",
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((m) => m.heroId === first.heroId && m.outcome === first.outcome)).toBe(true);
    expect(out.every((m) => m.gameMode === "normal")).toBe(true);
  });

  it("le curseur est lié aux filtres : un autre filtre avec l'ancien curseur est refusé", async () => {
    const page = await getPlayerMatches(ID, { period: "30d", limit: 10 });
    expect(page.nextCursor).not.toBeNull();
    const bad = await getPlayerMatches(ID, {
      period: "30d",
      outcome: "win",
      limit: 10,
      cursor: page.nextCursor!,
    }).catch((e: unknown) => e);
    expect(bad).toBeInstanceOf(ApiError);
    expect((bad as ApiError).status).toBe(400);
    // mêmes filtres : accepté
    const ok = await getPlayerMatches(ID, { period: "30d", limit: 10, cursor: page.nextCursor! });
    expect(ok.items[0]?.matchId).not.toBe(page.items[0]?.matchId);
  });

  it("les pages ne se recoupent pas et appliedFilters reflète la requête", async () => {
    const { out } = await allMatches({ period: "7d" });
    expect(new Set(out.map((m) => m.matchId)).size).toBe(out.length);
    const page = await getPlayerMatches(ID, { period: "7d", matchMode: "ranked", limit: 5 });
    expect(page.appliedFilters).toMatchObject({ period: "7d", matchMode: "ranked", heroId: null });
  });

  it("sans filtre : tout l'historique, comme en v1.8", async () => {
    const { out } = await allMatches({});
    expect(out).toHaveLength(42);
  });

  it("aucun résultat : liste vide et pas de curseur", async () => {
    const page = await getPlayerMatches(ID, { period: "7d", heroId: 99999 });
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});

describe("héros v1.9.0", () => {
  it("le top 3 de l'overview correspond aux héros de l'onglet pour le même scope", async () => {
    for (const s of [
      scope(),
      scope({ period: "7d" }),
      scope({ matchMode: "ranked", gameMode: "normal" }),
    ]) {
      const [o, h] = await Promise.all([getPlayerOverview(ID, s), getPlayerHeroes(ID, s)]);
      expect(o.topHeroes.map((x) => [x.heroId, x.matches, x.wins, x.kda])).toEqual(
        h.items.slice(0, 3).map((x) => [x.heroId, x.matches, x.wins, x.kda]),
      );
    }
  });

  it("livre pertes, échantillons et valeur nette par minute", async () => {
    const h = await getPlayerHeroes(ID, scope());
    const top = h.items[0]!;
    expect(top.losses).toBe(top.matches - top.wins);
    expect(top.kdaSampleSize).toBeLessThanOrEqual(top.matches);
    expect(top.avgNetWorthPerMinute).not.toBeNull();
    expect(h.appliedFilters).toMatchObject({ period: "30d" });
  });

  it("changer de période change la population, sans scope : tout l'historique", async () => {
    const all = await getPlayerHeroes(ID);
    const d7 = await getPlayerHeroes(ID, scope({ period: "7d" }));
    const total = (r: typeof all) => r.items.reduce((s, x) => s + x.matches, 0);
    expect(total(all)).toBe(42);
    expect(total(d7)).toBeLessThan(total(all));
    expect(all.appliedFilters?.period).toBeNull();
  });
});
