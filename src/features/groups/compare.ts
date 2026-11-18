import type { GroupHighlight, GroupMemberStats, HighlightKey, RankTier } from "@/api";
import { scoreLabel } from "@/lib/rank";

export { scoreLabel };

export type SortKey = "rank" | "climb" | "winRate" | "kda" | "wins";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "rank", label: "Rang" },
  { key: "climb", label: "Progression" },
  { key: "winRate", label: "Taux de victoire" },
  { key: "kda", label: "KDA" },
  { key: "wins", label: "Victoires" },
];

/** Valeurs du back (`currentRankScore`, `rankDelta`) : le front ne les recalcule pas, il trie seulement. */
const value = (m: GroupMemberStats, key: SortKey): number => {
  switch (key) {
    case "rank":
      return m.currentRankScore ?? -1;
    case "climb":
      return m.rankDelta ?? -999;
    case "winRate":
      return m.winRate ?? -1;
    case "kda":
      return m.kda ?? -1;
    case "wins":
      return m.wins;
  }
};

export const sortMembers = (members: GroupMemberStats[], key: SortKey) =>
  [...members].sort(
    (a, b) => value(b, key) - value(a, key) || a.displayName.localeCompare(b.displayName),
  );

export interface HighlightCard {
  id: HighlightKey;
  title: string;
  /** Tous les ex æquo, dans l'ordre du groupe. */
  members: GroupMemberStats[];
  value: string;
  detail?: string;
  matchId?: string;
}

const TITLES: Record<HighlightKey, string> = {
  biggest_climb: "Plus forte progression",
  best_win_rate: "Meilleur taux de victoire",
  most_wins: "Le plus de victoires",
  best_kda: "Meilleur KDA moyen",
  longest_win_streak: "Plus longue série",
  best_match: "Plus belle partie",
};

/**
 * Titres de la période : le back décide qui gagne (règles, seuils, ex æquo). Ce module ne fait que les
 * nommer et formater leur valeur ; une entrée sans gagnant n'est pas affichée.
 */
export function highlightCards(
  highlights: GroupHighlight[] | undefined,
  members: GroupMemberStats[],
  ranks: RankTier[] | undefined,
): HighlightCard[] {
  const byId = new Map(members.map((m) => [m.steamId, m]));
  return (highlights ?? []).flatMap((h) => {
    const winners = h.steamIds.flatMap((id) => byId.get(id) ?? []);
    const first = winners[0];
    if (!first || h.value === null) return [];
    const card = (value: string, detail?: string, matchId?: string): HighlightCard => ({
      id: h.key,
      title: TITLES[h.key],
      members: winners,
      value,
      detail,
      matchId,
    });
    switch (h.key) {
      case "biggest_climb": {
        const a = first.rankHistory[0];
        const b = first.rankHistory[first.rankHistory.length - 1];
        return [
          card(
            `+${h.value} sous-rang${h.value > 1 ? "s" : ""}`,
            a && b ? `${scoreLabel(a.score, ranks)} à ${scoreLabel(b.score, ranks)}` : undefined,
          ),
        ];
      }
      case "best_win_rate":
        return [card(`${h.value} %`, `${first.matches} parties`)];
      case "most_wins":
        return [card(`${h.value} victoires`)];
      case "best_kda":
        return [card(String(h.value))];
      case "longest_win_streak":
        return [card(`${h.value} victoires d'affilée`)];
      case "best_match": {
        const m = first.bestMatch;
        if (!m) return [];
        return [
          card(
            `${m.kills} / ${m.deaths} / ${m.assists}`,
            `${m.heroName}, KDA ${m.kda}`,
            h.matchId ?? m.matchId,
          ),
        ];
      }
    }
  });
}
