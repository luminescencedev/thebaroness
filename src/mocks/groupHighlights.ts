import type { GroupHighlight, GroupMemberStats, HighlightKey } from "@/api/types";

/**
 * Reproduit côté mock les titres de la période du back (v1.12.0) : valeur strictement positive, valeur inconnue =
 * non éligible, seuil de 5 parties pour le taux de victoire et le KDA, TOUS les ex æquo, aucun départage par le nom.
 * Valeurs SYNTHETIQUES : seule la règle reproduit le contrat.
 */
export const HIGHLIGHT_MIN_MATCHES = 5;

type Rule = {
  key: HighlightKey;
  minMatches: number;
  value: (m: GroupMemberStats) => number | null;
};

const RULES: Rule[] = [
  { key: "biggest_climb", minMatches: 0, value: (m) => m.rankDelta ?? null },
  { key: "best_win_rate", minMatches: HIGHLIGHT_MIN_MATCHES, value: (m) => m.winRate },
  { key: "most_wins", minMatches: 0, value: (m) => m.wins },
  { key: "best_kda", minMatches: HIGHLIGHT_MIN_MATCHES, value: (m) => m.kda },
  { key: "longest_win_streak", minMatches: 0, value: (m) => m.longestWinStreak },
  { key: "best_match", minMatches: 0, value: (m) => m.bestMatch?.kda ?? null },
];

export function groupHighlights(members: GroupMemberStats[]): GroupHighlight[] {
  return RULES.map((rule) => {
    const eligible = members.filter((m) => m.matches >= rule.minMatches && rule.value(m) !== null);
    const top = Math.max(0, ...eligible.map((m) => rule.value(m) as number));
    const winners = top > 0 ? eligible.filter((m) => rule.value(m) === top) : [];
    return {
      key: rule.key,
      steamIds: winners.map((m) => m.steamId),
      value: winners.length ? top : null,
      matchId: rule.key === "best_match" ? (winners[0]?.bestMatch?.matchId ?? null) : null,
      eligibleMembers: eligible.length,
      minMatches: rule.minMatches,
    };
  });
}
