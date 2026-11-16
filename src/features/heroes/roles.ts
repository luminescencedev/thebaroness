import type { HeroRole } from "@/api";

export const ROLE_LABELS: Record<HeroRole, string> = {
  assassin: "Assassin",
  brawler: "Bagarreur",
  marksman: "Tireur",
  mystic: "Mystique",
  healer: "Soigneur",
};

export const ROLES = Object.keys(ROLE_LABELS) as HeroRole[];

export const complexityLabel = (c: number | null): string =>
  c === 1 ? "Simple" : c === 2 ? "Intermédiaire" : c === 3 ? "Complexe" : "Non précisée";
