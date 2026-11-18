/** Couleurs des joueurs d'un groupe : indexées sur l'ordre du groupe, donc stables quel que soit le tri. */
export const MEMBER_COLORS = [
  "#b4abff",
  "#3dd68c",
  "#f5b14c",
  "#ff6b6f",
  "#5b9dff",
  "#e879f9",
  "#2dd4bf",
  "#fb923c",
  "#a3e635",
  "#f472b6",
] as const;

export function memberColor(groupIds: readonly string[], steamId: string): string {
  const i = Math.max(0, groupIds.indexOf(steamId));
  return MEMBER_COLORS[i % MEMBER_COLORS.length] ?? "#ffffff";
}
