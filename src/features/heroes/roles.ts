import type { HeroRole } from "@/api";

/** Rôles tels que le jeu les nomme (données de jeu en anglais). */
export const ROLE_LABELS: Record<HeroRole, string> = {
  assassin: "Assassin",
  brawler: "Brawler",
  marksman: "Marksman",
  mystic: "Mystic",
  healer: "Healer",
};

export const ROLES = Object.keys(ROLE_LABELS) as HeroRole[];

export const complexityLabel = (c: number | null): string =>
  c === 1 ? "Simple" : c === 2 ? "Intermédiaire" : c === 3 ? "Complexe" : "Non précisée";
