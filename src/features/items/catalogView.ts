import type { CatalogItem, ItemCategory, ItemStats } from "@/api";
import { isValidCost } from "./costs";
import { itemName } from "./tone";

export type ItemSort = "name" | "cost" | "tier" | "matches";
export type SortDir = "asc" | "desc";

export interface ItemFilter {
  q: string;
  slot: ItemCategory | null;
  tier: number | null;
  /** Montant exact (CatalogItem.cost). null : pas de filtre. 0 est un montant valide. */
  cost: number | null;
  /** false : seulement les objets achetables et actifs. */
  allShops: boolean;
}

/** Objets visibles selon le réglage « boutique » (avant tout autre filtre) : sert à dériver les options de coût. */
export const inShopScope = (items: readonly CatalogItem[], allShops: boolean) =>
  allShops ? [...items] : items.filter((i) => i.shopable && !i.disabled);

export function filterItems(items: readonly CatalogItem[], f: ItemFilter): CatalogItem[] {
  const needle = f.q.trim().toLowerCase();
  return inShopScope(items, f.allShops).filter(
    (i) =>
      (!f.slot || i.slot === f.slot) &&
      (f.tier === null || i.tier === f.tier) &&
      (f.cost === null || i.cost === f.cost) &&
      (!needle || itemName(i).toLowerCase().includes(needle)),
  );
}

/** Ordre par défaut : croissant, sauf le volume d'achats (le plus gros d'abord). */
export const defaultDir = (sort: ItemSort): SortDir => (sort === "matches" ? "desc" : "asc");

/**
 * Tri stable. Une valeur inconnue (null) reste TOUJOURS en fin de liste, dans les deux sens, et n'est jamais
 * traitée comme 0. Égalités départagées par nom puis identifiant.
 */
export function sortItems(
  items: readonly CatalogItem[],
  sort: ItemSort,
  dir: SortDir,
  statsById: ReadonlyMap<number, Pick<ItemStats, "matches">>,
): CatalogItem[] {
  const key = (i: CatalogItem): number | null =>
    sort === "cost"
      ? isValidCost(i.cost)
        ? i.cost
        : null
      : sort === "tier"
        ? i.tier
        : sort === "matches"
          ? (statsById.get(i.id)?.matches ?? null)
          : null;
  const sign = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sort !== "name") {
      const ka = key(a);
      const kb = key(b);
      if (ka === null && kb !== null) return 1;
      if (kb === null && ka !== null) return -1;
      if (ka !== null && kb !== null && ka !== kb) return (ka - kb) * sign;
    } else {
      const byName = itemName(a).localeCompare(itemName(b)) * sign;
      if (byName) return byName;
    }
    return itemName(a).localeCompare(itemName(b)) || a.id - b.id;
  });
}
