import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type {
  GameModeFilter,
  MatchModeFilter,
  OutcomeFilter,
  ProfileScope,
  StatPeriod,
} from "@/api";

/** Valeurs par défaut du profil : alignées sur `/overview` du back (30 jours, tous modes). */
export const DEFAULT_SCOPE: ProfileScope = { period: "30d", gameMode: "all", matchMode: "all" };

export const PERIODS: { value: StatPeriod; label: string; long: string }[] = [
  { value: "7d", label: "7 jours", long: "7 derniers jours" },
  { value: "30d", label: "30 jours", long: "30 derniers jours" },
  { value: "season", label: "Saison", long: "saison en cours" },
];
export const GAME_MODES: { value: GameModeFilter; label: string }[] = [
  { value: "all", label: "Tous les formats" },
  { value: "normal", label: "Normal" },
  { value: "street_brawl", label: "Street Brawl" },
];
export const MATCH_MODES: { value: MatchModeFilter; label: string }[] = [
  { value: "all", label: "Tous les types" },
  { value: "ranked", label: "Classée" },
  { value: "unranked", label: "Non classée" },
];
export const OUTCOMES: { value: OutcomeFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "win", label: "Victoires" },
  { value: "loss", label: "Défaites" },
];

const pick = <T extends string>(list: { value: T }[], raw: string | null, fallback: T): T =>
  list.find((o) => o.value === raw)?.value ?? fallback;

export function parseScope(params: URLSearchParams): ProfileScope {
  return {
    period: pick(PERIODS, params.get("period"), DEFAULT_SCOPE.period),
    gameMode: pick(GAME_MODES, params.get("gameMode"), DEFAULT_SCOPE.gameMode),
    matchMode: pick(MATCH_MODES, params.get("matchMode"), DEFAULT_SCOPE.matchMode),
  };
}

/** Filtres propres à la liste des parties, en plus du scope. */
export interface MatchFilters extends ProfileScope {
  outcome: OutcomeFilter;
  heroId: number | null;
}

export function parseMatchFilters(params: URLSearchParams): MatchFilters {
  const hero = Number(params.get("matchHero"));
  return {
    ...parseScope(params),
    outcome: pick(OUTCOMES, params.get("outcome"), "all"),
    heroId: Number.isInteger(hero) && hero > 0 ? hero : null,
  };
}

/**
 * Scope statistique partagé : période, format et type de partie vivent dans l'URL et alimentent
 * ensemble l'aperçu, la courbe, l'activité, la liste des parties et l'onglet Héros.
 */
export function useProfileScope() {
  const [params, setParams] = useSearchParams();
  const scope = useMemo(() => parseScope(params), [params]);
  const filters = useMemo(() => parseMatchFilters(params), [params]);
  const setScope = useCallback(
    (patch: Partial<ProfileScope>) =>
      setParams(
        (cur) => {
          const next = new URLSearchParams(cur);
          const merged = { ...parseScope(cur), ...patch };
          for (const k of ["period", "gameMode", "matchMode"] as const) {
            if (merged[k] === DEFAULT_SCOPE[k]) next.delete(k);
            else next.set(k, merged[k]);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  /** Filtres propres aux parties (résultat, héros) : `null` ou "all" les retire de l'URL. */
  const setMatchFilters = useCallback(
    (patch: { outcome?: OutcomeFilter; heroId?: number | null }) =>
      setParams(
        (cur) => {
          const next = new URLSearchParams(cur);
          if ("outcome" in patch) {
            if (!patch.outcome || patch.outcome === "all") next.delete("outcome");
            else next.set("outcome", patch.outcome);
          }
          if ("heroId" in patch) {
            if (!patch.heroId) next.delete("matchHero");
            else next.set("matchHero", String(patch.heroId));
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const isDefault =
    scope.period === DEFAULT_SCOPE.period && scope.gameMode === "all" && scope.matchMode === "all";
  return { scope, filters, setScope, setMatchFilters, isDefault };
}
