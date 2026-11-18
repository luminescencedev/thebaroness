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

/** Valeur de tri fournie par le back ; null quand elle est inconnue (jamais 0). */
export const sortValue = (m: GroupMemberStats, key: SortKey): number | null => {
  switch (key) {
    case "rank":
      return m.currentRankScore ?? null;
    case "climb":
      return m.rankDelta ?? null;
    case "winRate":
      return m.winRate;
    case "kda":
      return m.kda;
    case "wins":
      return m.wins;
  }
};

/** Tri d'affichage : valeur décroissante, inconnus en dernier, nom en dernier recours. */
export const sortMembers = (members: GroupMemberStats[], key: SortKey) =>
  [...members].sort(
    (a, b) =>
      (sortValue(b, key) ?? Number.NEGATIVE_INFINITY) -
        (sortValue(a, key) ?? Number.NEGATIVE_INFINITY) ||
      a.displayName.localeCompare(b.displayName),
  );

export interface PositionedMember {
  member: GroupMemberStats;
  /** Position dans le groupe selon le critère (1, 2, 2, 4) ; null si la valeur est inconnue. */
  position: number | null;
  /** Une autre personne du groupe a exactement la même valeur. */
  tied: boolean;
}

/**
 * Positions de présentation : les ex æquo partagent la meilleure position (1, 2, 2, 4), calculée sur la
 * valeur du critère actif. Ce n'est PAS le rang officiel du joueur : c'est sa place dans ce groupe.
 */
export function positionMembers(members: GroupMemberStats[], key: SortKey): PositionedMember[] {
  const sorted = sortMembers(members, key);
  return sorted.map((member) => {
    const v = sortValue(member, key);
    if (v === null) return { member, position: null, tied: false };
    const better = sorted.filter((o) => (sortValue(o, key) ?? Number.NEGATIVE_INFINITY) > v).length;
    const same = sorted.filter((o) => sortValue(o, key) === v).length;
    return { member, position: better + 1, tied: same > 1 };
  });
}

/** Membres du groupe absents de la comparaison (le back omet un membre dont les données manquent). */
export const unavailableIds = (groupIds: readonly string[], members: GroupMemberStats[]) =>
  groupIds.filter((id) => !members.some((m) => m.steamId === id));

/** Seuil sous lequel une proportion n'est pas fiable : celui des titres du back, 5 parties par défaut. */
export const DEFAULT_MIN_MATCHES = 5;
export const isLowSample = (m: GroupMemberStats, min = DEFAULT_MIN_MATCHES) => m.matches < min;

export interface HighlightRow {
  id: HighlightKey;
  title: string;
  /** Tous les ex æquo, dans l'ordre du groupe. */
  members: GroupMemberStats[];
  value: string;
  detail?: string;
  matchId?: string;
  /** Seuil de parties imposé par le back à ce titre (0 : aucun). */
  minMatches: number;
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
export function highlightRows(
  highlights: GroupHighlight[] | undefined,
  members: GroupMemberStats[],
  ranks: RankTier[] | undefined,
): HighlightRow[] {
  const byId = new Map(members.map((m) => [m.steamId, m]));
  return (highlights ?? []).flatMap((h) => {
    const winners = h.steamIds.flatMap((id) => byId.get(id) ?? []);
    const first = winners[0];
    if (!first || h.value === null) return [];
    const card = (value: string, detail?: string, matchId?: string): HighlightRow => ({
      id: h.key,
      title: TITLES[h.key],
      members: winners,
      value,
      detail,
      matchId,
      minMatches: h.minMatches,
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
