import { describe, expect, it } from "vitest";
import type { CatalogItem } from "@/api";
import { syntheticCatalog } from "@/mocks/synthetic";
import {
  PREFERRED_COSTS,
  costOptions,
  isValidCost,
  parseCostParam,
  splitCostOptions,
} from "./costs";
import { defaultDir, filterItems, inShopScope, sortItems, type ItemFilter } from "./catalogView";
import { resaleTime } from "./format";

const mk = (id: number, over: Partial<CatalogItem> = {}): CatalogItem => ({
  id,
  className: `i${id}`,
  name: `Item ${id}`,
  type: "upgrade",
  slot: "weapon",
  tier: 1,
  cost: 800,
  isActive: false,
  shopable: true,
  disabled: false,
  heroIds: [],
  componentIds: [],
  imageUrl: null,
  ...over,
});
const none: ItemFilter = { q: "", slot: null, tier: null, cost: null, allShops: false };
const noStats = new Map<number, { matches: number }>();

describe("prix de référence du mock", () => {
  it("les tiers I à IV suivent 800, 1 600, 3 200 et 6 400 (jamais 2 400 pour le tier III)", () => {
    const byTier = new Map<number, Set<number | null>>();
    for (const i of syntheticCatalog.slice(0, 20)) {
      const set = byTier.get(i.tier ?? 0) ?? new Set();
      set.add(i.cost);
      byTier.set(i.tier ?? 0, set);
    }
    expect([...byTier.get(1)!]).toEqual([800]);
    expect([...byTier.get(2)!]).toEqual([1600]);
    expect([...byTier.get(3)!]).toEqual([3200]);
    expect([...byTier.get(4)!]).toEqual([6400]);
    expect(PREFERRED_COSTS).toEqual([800, 1600, 3200, 6400]);
  });

  it("couvre les cas limites autorisés par le contrat", () => {
    const costs = syntheticCatalog.map((i) => i.cost);
    expect(costs).toContain(null);
    expect(syntheticCatalog.some((i) => i.tier === null)).toBe(true);
    expect(syntheticCatalog.some((i) => !i.shopable && i.disabled)).toBe(true);
    expect(syntheticCatalog.some((i) => i.componentIds.length > 0)).toBe(true);
    // prix identiques pour plusieurs objets
    expect(costs.filter((c) => c === 800).length).toBeGreaterThan(1);
  });
});

describe("options de coût dérivées du catalogue", () => {
  it("dédupliquées, croissantes, null ignoré, 0 conservé, valeurs invalides ignorées", () => {
    const items = [
      mk(1, { cost: 3200 }),
      mk(2, { cost: 800 }),
      mk(3, { cost: 800 }),
      mk(4, { cost: null }),
      mk(5, { cost: 0 }),
      mk(6, { cost: Number.NaN }),
      mk(7, { cost: -10 }),
      mk(8, { cost: Number.POSITIVE_INFINITY }),
      mk(9, { cost: 2400 }),
    ];
    expect(costOptions(items)).toEqual([
      { value: 0, count: 1 },
      { value: 800, count: 2 },
      { value: 2400, count: 1 },
      { value: 3200, count: 1 },
    ]);
  });

  it("2 400 n'apparaît que si un objet en a un", () => {
    expect(costOptions(syntheticCatalog.slice(0, 20)).map((o) => o.value)).toEqual([
      800, 1600, 3200, 6400,
    ]);
    expect(costOptions([mk(1, { cost: 2400 })]).map((o) => o.value)).toEqual([2400]);
  });

  it("catalogue vide : aucune option", () => {
    expect(costOptions([])).toEqual([]);
  });

  it("suit une nouvelle version du catalogue (coûts modifiés)", () => {
    const v1 = [mk(1, { cost: 800 }), mk(2, { cost: 1600 })];
    const v2 = [mk(1, { cost: 900 }), mk(2, { cost: 1600 }), mk(3, { cost: 4000 })];
    expect(costOptions(v1).map((o) => o.value)).toEqual([800, 1600]);
    expect(costOptions(v2).map((o) => o.value)).toEqual([900, 1600, 4000]);
  });

  it("isValidCost", () => {
    expect(isValidCost(0)).toBe(true);
    expect(isValidCost(800)).toBe(true);
    expect([null, undefined, Number.NaN, -1, "800"].some(isValidCost)).toBe(false);
  });
});

describe("répartition boutons / menu « Autres prix »", () => {
  const opts = (vals: number[]) => vals.map((value) => ({ value, count: 1 }));
  it("peu de montants : tout en boutons", () => {
    const r = splitCostOptions(opts([800, 1600, 3200, 6400, 9999]));
    expect(r.more).toEqual([]);
    expect(r.primary).toHaveLength(5);
  });
  it("beaucoup de montants : les standards d'abord, le reste est dans le menu, rien n'est perdu", () => {
    const all = opts([100, 450, 800, 1000, 1600, 2400, 3200, 4000, 6400, 7200]);
    const r = splitCostOptions(all, 6);
    expect(r.primary.map((o) => o.value)).toEqual(expect.arrayContaining([800, 1600, 3200, 6400]));
    expect(r.primary.length).toBeLessThanOrEqual(6);
    expect([...r.primary, ...r.more].map((o) => o.value).sort((a, b) => a - b)).toEqual(
      all.map((o) => o.value),
    );
    expect(r.primary.map((o) => o.value)).toEqual(
      [...r.primary.map((o) => o.value)].sort((a, b) => a - b),
    );
  });
});

describe("paramètre d'URL cost", () => {
  it("accepte un montant quelconque, ignore low, mid, high et le reste", () => {
    expect(parseCostParam("800")).toBe(800);
    expect(parseCostParam("2400")).toBe(2400);
    expect(parseCostParam("7777")).toBe(7777);
    expect(parseCostParam("0")).toBe(0);
    for (const bad of ["low", "mid", "high", "", "-5", "12.5", "1e3", "abc", "99999999999", null])
      expect(parseCostParam(bad)).toBeNull();
  });
});

describe("filtre exact et combinaisons", () => {
  const items = [
    mk(1, { name: "Alpha", cost: 800, tier: 1, slot: "weapon" }),
    mk(2, { name: "Bravo", cost: 800, tier: 1, slot: "spirit" }),
    mk(3, { name: "Charlie", cost: 1600, tier: 2, slot: "spirit" }),
    mk(4, { name: "Delta", cost: 2400, tier: 3, slot: "vitality" }),
    mk(5, { name: "Echo", cost: 3200, tier: 3, slot: "spirit" }),
    mk(6, { name: "Foxtrot", cost: 6400, tier: 4 }),
    mk(7, { name: "Golf", cost: null, tier: 2 }),
    mk(8, { name: "Hotel", cost: 0, tier: 1 }),
    mk(9, { name: "India", cost: 3200, tier: 3, shopable: false, disabled: true }),
  ];
  const ids = (f: Partial<ItemFilter>) => filterItems(items, { ...none, ...f }).map((i) => i.id);

  it("un montant exact ne garde que les objets à ce prix", () => {
    expect(ids({ cost: 800 })).toEqual([1, 2]);
    expect(ids({ cost: 1600 })).toEqual([3]);
    expect(ids({ cost: 2400 })).toEqual([4]);
    expect(ids({ cost: 3200 })).toEqual([5]); // India est retiré de la boutique
    expect(ids({ cost: 6400 })).toEqual([6]);
  });
  it("0 est un montant distinct de l'inconnu", () => {
    expect(ids({ cost: 0 })).toEqual([8]);
    expect(ids({ cost: null })).toContain(7);
  });
  it("un montant absent donne une liste vide, pas une erreur", () => {
    expect(ids({ cost: 12345 })).toEqual([]);
  });
  it("Tous retire seulement le filtre de coût", () => {
    expect(ids({ cost: null, slot: "spirit" })).toEqual([2, 3, 5]);
  });
  it("prix + catégorie, prix + tier, prix + recherche", () => {
    expect(ids({ cost: 800, slot: "spirit" })).toEqual([2]);
    expect(ids({ cost: 3200, tier: 3 })).toEqual([5]);
    expect(ids({ cost: 800, tier: 2 })).toEqual([]);
    expect(ids({ cost: 800, q: "alp" })).toEqual([1]);
    expect(ids({ cost: 800, q: "zzz" })).toEqual([]);
  });
  it("le réglage boutique élargit le périmètre sans changer le montant", () => {
    expect(ids({ cost: 3200, allShops: true })).toEqual([5, 9]);
    expect(inShopScope(items, true)).toHaveLength(9);
  });
});

describe("tri", () => {
  const items = [
    mk(1, { name: "B", cost: 1600 }),
    mk(2, { name: "A", cost: 800 }),
    mk(3, { name: "C", cost: null }),
    mk(4, { name: "D", cost: 800 }),
    mk(5, { name: "E", cost: 6400 }),
    mk(6, { name: "F", cost: 0 }),
  ];
  const order = (s: "cost" | "name" | "tier" | "matches", d: "asc" | "desc", st = noStats) =>
    sortItems(items, s, d, st).map((i) => i.name);

  it("coût croissant : prix inconnu en dernier, égalités par nom", () => {
    expect(order("cost", "asc")).toEqual(["F", "A", "D", "B", "E", "C"]);
  });
  it("coût décroissant : prix inconnu toujours en dernier, égalités par nom", () => {
    expect(order("cost", "desc")).toEqual(["E", "B", "A", "D", "F", "C"]);
  });
  it("le tri est stable et ne mute pas l'entrée", () => {
    const before = items.map((i) => i.id);
    order("cost", "asc");
    expect(items.map((i) => i.id)).toEqual(before);
    const same = [mk(2, { name: "Same", cost: 800 }), mk(1, { name: "Same", cost: 800 })];
    expect(sortItems(same, "cost", "asc", noStats).map((i) => i.id)).toEqual([1, 2]);
  });
  it("tier : inconnu en dernier dans les deux sens", () => {
    const t = [
      mk(1, { name: "A", tier: 2 }),
      mk(2, { name: "B", tier: null }),
      mk(3, { name: "C", tier: 1 }),
    ];
    expect(sortItems(t, "tier", "asc", noStats).map((i) => i.name)).toEqual(["C", "A", "B"]);
    expect(sortItems(t, "tier", "desc", noStats).map((i) => i.name)).toEqual(["A", "C", "B"]);
  });
  it("achats : sans statistiques en dernier dans les deux sens", () => {
    const st = new Map([
      [1, { matches: 50 }],
      [2, { matches: 900 }],
    ]);
    expect(order("matches", "desc", st).slice(0, 2)).toEqual(["A", "B"]);
    expect(order("matches", "asc", st).slice(0, 2)).toEqual(["B", "A"]);
    expect(order("matches", "asc", st).slice(2).sort()).toEqual(["C", "D", "E", "F"]);
  });
  it("ordre par défaut", () => {
    expect(defaultDir("cost")).toBe("asc");
    expect(defaultDir("matches")).toBe("desc");
  });
});

describe("temps moyen de revente", () => {
  it("jamais revendu, durée indisponible, n/d, durée réelle", () => {
    expect(resaleTime({ sold: 0, avgSellTimeSeconds: null }).value).toBe("Jamais revendu");
    expect(resaleTime({ sold: 12, avgSellTimeSeconds: null }).value).toBe(
      "Temps moyen indisponible",
    );
    expect(resaleTime({ sold: 12, avgSellTimeSeconds: null }).hint).not.toMatch(
      /Aucune revente observée/,
    );
    expect(resaleTime({ sold: null, avgSellTimeSeconds: null }).value).toBe("n/d");
    expect(resaleTime({ sold: 3, avgSellTimeSeconds: 754 }).value).toBe("12:34");
  });
});
