import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { ItemCategory } from "@/api";
import { CATEGORIES } from "./tone";

export type ItemSort = "name" | "cost" | "tier" | "matches";
const SORTS: ItemSort[] = ["name", "cost", "tier", "matches"];

export const COST_BANDS = [
  { value: "low", label: "≤ 1 000", test: (c: number) => c <= 1000 },
  { value: "mid", label: "1 001 à 3 000", test: (c: number) => c > 1000 && c <= 3000 },
  { value: "high", label: "> 3 000", test: (c: number) => c > 3000 },
] as const;
export type CostBand = (typeof COST_BANDS)[number]["value"];

/** Filtres du catalogue d'objets, dans l'URL. La période et le type de partie vivent dans statsScope. */
export function useItemFilters() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const slot = CATEGORIES.find((c) => c === params.get("slot")) ?? null;
  const tierRaw = Number(params.get("tier"));
  const tier = Number.isInteger(tierRaw) && tierRaw >= 1 && tierRaw <= 5 ? tierRaw : null;
  const cost = COST_BANDS.find((b) => b.value === params.get("cost"))?.value ?? null;
  const allShops = params.get("shop") === "all";
  const sort = SORTS.find((s) => s === params.get("sort")) ?? "name";

  const set = useCallback(
    (key: string, value: string | null, replace = true) =>
      setParams(
        (cur) => {
          const next = new URLSearchParams(cur);
          if (value) next.set(key, value);
          else next.delete(key);
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
      cost: cost as CostBand | null,
      allShops,
      sort: sort as ItemSort,
      setQ: (v: string) => set("q", v.trim() ? v : null),
      setSlot: (v: ItemCategory | null) => set("slot", v, false),
      setTier: (v: number | null) => set("tier", v === null ? null : String(v), false),
      setCost: (v: CostBand | null) => set("cost", v, false),
      setAllShops: (v: boolean) => set("shop", v ? "all" : null, false),
      setSort: (v: ItemSort) => set("sort", v === "name" ? null : v),
      reset: () =>
        setParams(
          (cur) => {
            const next = new URLSearchParams();
            for (const k of ["period", "mode"]) if (cur.get(k)) next.set(k, cur.get(k) as string);
            return next;
          },
          { replace: true },
        ),
      active: Boolean(q || slot || tier || cost || allShops),
    }),
    [q, slot, tier, cost, allShops, sort, set, setParams],
  );
}
