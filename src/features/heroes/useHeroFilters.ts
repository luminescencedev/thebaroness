import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { HeroRole } from "@/api";
import { ROLES } from "./roles";

export type HeroSort = "name" | "role" | "complexity";
const SORTS: HeroSort[] = ["name", "role", "complexity"];

/** Recherche, rôle et tri du catalogue, dans l'URL (retour arrière et lien partageable). */
export function useHeroFilters() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const role = ROLES.find((r) => r === params.get("role")) ?? null;
  const sort = SORTS.find((s) => s === params.get("sort")) ?? "name";

  const update = useCallback(
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
      role: role as HeroRole | null,
      sort: sort as HeroSort,
      setQ: (v: string) => update("q", v.trim() ? v : null),
      setRole: (v: HeroRole | null) => update("role", v, false),
      setSort: (v: HeroSort) => update("sort", v === "name" ? null : v),
      reset: () => setParams({}, { replace: true }),
      active: Boolean(q || role),
    }),
    [q, role, sort, update, setParams],
  );
}
