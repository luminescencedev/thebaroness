import type { RankTier } from "@/api";
import { ROMAN } from "./stats";

/** « Oracle 4 » devient « Oracle IV » : nom du rang et sous-rang en chiffres romains. */
export function rankLabel(name: string | null, subrank: number | null | undefined): string | null {
  if (!name) return null;
  const base = name.replace(/\s+\d+$/, "");
  return subrank && ROMAN[subrank] ? `${base} ${ROMAN[subrank]}` : name;
}

/**
 * Score de rang du back : tier * 6 + sous-rang (1 à 6), maximum 72. SEUL endroit du front qui connaît cette
 * arithmétique ; les écrans l'utilisent pour nommer un score, jamais pour en inventer un.
 */
export const RANK_SUBRANKS = 6;

export const rankScore = (tier: number, subrank: number): number => tier * RANK_SUBRANKS + subrank;

export function decodeRankScore(score: number): { tier: number; subrank: number } {
  const tier = Math.floor((score - 1) / RANK_SUBRANKS);
  return { tier, subrank: score - tier * RANK_SUBRANKS };
}

/** « Oracle 3 » depuis un score ; « Rang N » si le tier est absent du catalogue des rangs. */
export function scoreLabel(score: number, ranks: RankTier[] | undefined): string {
  const { tier, subrank } = decodeRankScore(score);
  return `${ranks?.find((r) => r.tier === tier)?.name ?? `Rang ${tier}`} ${subrank}`;
}
