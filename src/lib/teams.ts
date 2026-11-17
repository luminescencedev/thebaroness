import type { TeamSide } from "@/api";

/**
 * Équipes du jeu. Les identifiants techniques `amber` et `sapphire` sont ceux du back ; seuls les noms
 * affichés changent. Source unique : ne pas dupliquer ces libellés ailleurs.
 */
export const TEAM_META: Record<TeamSide, { label: string; color: string; tint: string }> = {
  amber: { label: "Hidden King", color: "#f5b14c", tint: "rgb(245 177 76 / 0.12)" },
  sapphire: { label: "Archmother", color: "#5b9dff", tint: "rgb(91 157 255 / 0.12)" },
};

export const teamLabel = (side: TeamSide): string => TEAM_META[side].label;
