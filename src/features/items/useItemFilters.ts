import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { ItemCategory } from "@/api";
import { defaultDir, type ItemSort, type SortDir } from "./catalogView";
import { parseCostParam } from "./costs";
import { CATEGORIES } from "./tone";

const SORTS: ItemSort[] = ["name", "cost", "tier", "matches"];

/**
 * Filtres du catalogue d'objets, dans l'URL. La période et le type de partie vivent dans statsScope.
 * `costParam` est la valeur brute lue : sa validité dépend du catalogue, vérifiée par la page.
 */
export function useItemFilters() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const slot = CATEGORIES.find((c) => c === params.get("slot")) ?? null;
  const tierRaw = Number(params.get("tier"));
  const tier = Number.isInteger(tierRaw) && tierRaw >= 1 && tierRaw <= 5 ? tierRaw : null;
  const costRaw = params.get("cost");
  const costParam = parseCostParam(costRaw);
  const allShops = params.get("shop") === "all";
  const sort = SORTS.find((s) => s === params.get("sort")) ?? "name";
  const dir: SortDir =
    params.get("dir") === "asc" || params.get("dir") === "desc"
      ? (params.get("dir") as SortDir)
      : defaultDir(sort);

  const set = useCallback(
    (patch: Record<string, string | null>, replace = true) =>
      setParams(
        (cur) => {
          const next = new URLSearchParams(cur);
          for (const [k, v] of Object.entries(patch)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        { replace },
      ),
    [setParams],
  );

  return useMemo(
    () => ({
      q,
      slot: slot as ItemCategory | null,
      tier,
      /** Valeur brute présente dans l'URL (peut être obsolète : low, mid, high, ou un montant absent). */
      costRaw,
      costParam,
      allShops,
      sort: sort as ItemSort,
      dir,
      setQ: (v: string) => set({ q: v.trim() ? v : null }),
      setSlot: (v: ItemCategory | null) => set({ slot: v }, false),
      setTier: (v: number | null) => set({ tier: v === null ? null : String(v) }, false),
      setCost: (v: number | null) => set({ cost: v === null ? null : String(v) }, false),
      /** Retire un `cost` obsolète ou introuvable : remplace l'entrée d'historique, sans en créer. */
      clearCost: () => set({ cost: null }, true),
      setAllShops: (v: boolean) => set({ shop: v ? "all" : null }, false),
      /** Changer de critère remet l'ordre par défaut de ce critère. */
      setSort: (v: ItemSort) => set({ sort: v === "name" ? null : v, dir: null }),
      setDir: (v: SortDir) => set({ dir: v === defaultDir(sort) ? null : v }),
      reset: () =>
        setParams(
          (cur) => {
            const next = new URLSearchParams();
            for (const k of ["period", "mode"]) if (cur.get(k)) next.set(k, cur.get(k) as string);
            return next;
          },
          { replace: true },
        ),
      active: Boolean(q || slot || tier || costRaw || allShops),
    }),
    [q, slot, tier, costRaw, costParam, allShops, sort, dir, set, setParams],
  );
}
