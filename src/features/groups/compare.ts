import type { GroupMemberStats, RankTier } from "@/api";
import { rankScore, scoreLabel } from "@/lib/rank";

export { scoreLabel };

export const rankDelta = (m: GroupMemberStats): number | null => {
  const first = m.rankHistory[0];
  const last = m.rankHistory[m.rankHistory.length - 1];
  return first && last ? last.score - first.score : null;
};

export const currentScore = (m: GroupMemberStats): number | null =>
  m.rank?.tier != null && m.rank.subrank != null ? rankScore(m.rank.tier, m.rank.subrank) : null;

export type SortKey = "rank" | "climb" | "winRate" | "kda" | "wins";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "rank", label: "Rang" },
  { key: "climb", label: "Progression" },
  { key: "winRate", label: "Taux de victoire" },
  { key: "kda", label: "KDA" },
  { key: "wins", label: "Victoires" },
];

const value = (m: GroupMemberStats, key: SortKey): number => {
  switch (key) {
    case "rank":
      return currentScore(m) ?? -1;
    case "climb":
      return rankDelta(m) ?? -999;
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

export interface Highlight {
  id: string;
  title: string;
  member: GroupMemberStats;
  value: string;
  detail?: string;
  matchId?: string;
}

const best = (
  members: GroupMemberStats[],
  score: (m: GroupMemberStats) => number | null,
  min = 0,
): GroupMemberStats | undefined =>
  members
    .filter((m) => score(m) !== null && (score(m) ?? 0) > min)
    .sort((a, b) => (score(b) ?? 0) - (score(a) ?? 0))[0];

/** Titres de la période, calculés côté front à partir des agrégats du back. */
export function buildHighlights(
  members: GroupMemberStats[],
  ranks: RankTier[] | undefined,
): Highlight[] {
  const out: Highlight[] = [];

  const climber = best(members, rankDelta);
  if (climber) {
    const first = climber.rankHistory[0];
    const last = climber.rankHistory[climber.rankHistory.length - 1];
    out.push({
      id: "climb",
      title: "Plus forte progression",
      member: climber,
      value: `+${rankDelta(climber)} sous-rang${(rankDelta(climber) ?? 0) > 1 ? "s" : ""}`,
      detail:
        first && last
          ? `${scoreLabel(first.score, ranks)} à ${scoreLabel(last.score, ranks)}`
          : undefined,
    });
  }

  const regular = members.filter((m) => m.matches >= 5);
  const wr = best(regular, (m) => m.winRate);
  if (wr)
    out.push({
      id: "wr",
      title: "Meilleur taux de victoire",
      member: wr,
      value: `${wr.winRate} %`,
      detail: `${wr.matches} parties`,
    });

  const wins = best(members, (m) => m.wins);
  if (wins)
    out.push({
      id: "wins",
      title: "Le plus de victoires",
      member: wins,
      value: `${wins.wins} victoires`,
    });

  const kda = best(regular, (m) => m.kda);
  if (kda)
    out.push({ id: "kda", title: "Meilleur KDA moyen", member: kda, value: String(kda.kda) });

  const streak = best(members, (m) => m.longestWinStreak);
  if (streak)
    out.push({
      id: "streak",
      title: "Plus longue série",
      member: streak,
      value: `${streak.longestWinStreak} victoires d'affilée`,
    });

  const game = best(members, (m) => m.bestMatch?.kda ?? null);
  if (game?.bestMatch)
    out.push({
      id: "game",
      title: "Plus belle partie",
      member: game,
      value: `${game.bestMatch.kills} / ${game.bestMatch.deaths} / ${game.bestMatch.assists}`,
      detail: `${game.bestMatch.heroName}, KDA ${game.bestMatch.kda}`,
      matchId: game.bestMatch.matchId,
    });

  return out;
}
