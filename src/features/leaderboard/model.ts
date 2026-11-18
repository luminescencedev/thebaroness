import type { LeaderboardEntry, LeaderboardRegion } from "@/api";

export const REGIONS: { value: LeaderboardRegion; label: string }[] = [
  { value: "Europe", label: "Europe" },
  { value: "NAmerica", label: "Amérique du Nord" },
  { value: "SAmerica", label: "Amérique du Sud" },
  { value: "Asia", label: "Asie" },
  { value: "Oceania", label: "Océanie" },
];

export const DEFAULT_REGION: LeaderboardRegion = "Europe";

/** Région de l'URL (`?region=`), Europe si la valeur est absente ou inconnue. */
export function parseRegion(value: string | null): LeaderboardRegion {
  return REGIONS.find((r) => r.value === value)?.value ?? DEFAULT_REGION;
}

/**
 * Ex æquo : la source reprend le même rang pour plusieurs entrées (1, 2, 2, 4). La marque vient des données,
 * jamais d'un calcul : une entrée est à égalité si une voisine porte le même rang.
 */
export function isTied(items: readonly LeaderboardEntry[], index: number): boolean {
  const rank = items[index]?.rank;
  return items[index - 1]?.rank === rank || items[index + 1]?.rank === rank;
}

/** Couleur de rang du back (`#RRGGBB`) : toute autre valeur est ignorée (elle finit dans un style en ligne). */
export function safeColor(color: string | null | undefined): string | null {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : null;
}
