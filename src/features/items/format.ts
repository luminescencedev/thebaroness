import type { ItemStats } from "@/api";
import { NA, formatDuration, formatInt } from "@/lib/format";

/** Temps moyen de revente : valeur affichée et explication, selon ce que la source renseigne vraiment. */
export function resaleTime(stats: Pick<ItemStats, "sold" | "avgSellTimeSeconds">): {
  value: string;
  hint: string;
} {
  const { sold, avgSellTimeSeconds: t } = stats;
  if (t !== null) return { value: formatDuration(t), hint: "Minutes de jeu" };
  if (sold === 0) return { value: "Jamais revendu", hint: "Aucune revente observée" };
  if (sold !== null && sold > 0)
    return {
      value: "Temps moyen indisponible",
      hint: `${formatInt(sold)} parties avec revente, durée non fournie`,
    };
  return { value: NA, hint: "Reventes non renseignées" };
}
