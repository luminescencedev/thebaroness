import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { AnalyticsMatchMode, AnalyticsPeriod } from "@/api";

export interface StatsScope {
  period: AnalyticsPeriod;
  /** Absent : tous types de partie. */
  matchMode?: AnalyticsMatchMode;
}

const PERIODS: AnalyticsPeriod[] = ["7d", "30d"];
type ModeValue = "all" | AnalyticsMatchMode;

/** Période et type de partie des statistiques, dans l'URL (`period`, `mode`). Défaut : 30 jours, tous types. */
export function useStatsScope() {
  const [params, setParams] = useSearchParams();
  const period = PERIODS.find((p) => p === params.get("period")) ?? "30d";
  const mode = (["ranked", "unranked"] as const).find((m) => m === params.get("mode"));

  const set = useCallback(
    (key: string, value: string | null) =>
      setParams(
        (cur) => {
          const next = new URLSearchParams(cur);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return useMemo(
    () => ({
      scope: { period, matchMode: mode } satisfies StatsScope,
      setPeriod: (p: AnalyticsPeriod) => set("period", p === "30d" ? null : p),
      setMatchMode: (m: ModeValue) => set("mode", m === "all" ? null : m),
    }),
    [period, mode, set],
  );
}

export const scopeLabel = (s: StatsScope) =>
  `${s.period === "7d" ? "7 derniers jours" : "30 derniers jours"}, ${
    s.matchMode === "ranked"
      ? "parties classées"
      : s.matchMode === "unranked"
        ? "parties non classées"
        : "tous types de partie"
  }`;
