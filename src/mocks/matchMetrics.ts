import type { MatchDetail, MatchPlayer, TeamTotalKey } from "@/api/types";

/**
 * Reproduit côté mock les métriques de partie calculées par le back (v1.12.0) : mêmes règles, valeurs
 * SYNTHETIQUES. Rang de compétition (1, 2, 2, 4), total nul dès qu'une valeur manque, distinction seulement si
 * la statistique est connue pour tous les joueurs, tous les ex æquo la reçoivent.
 */
const round2 = (n: number) => Math.round(n * 100) / 100;

const TOTALS: Record<TeamTotalKey, (p: MatchPlayer) => number | null> = {
  kills: (p) => p.kills,
  deaths: (p) => p.deaths,
  assists: (p) => p.assists,
  netWorth: (p) => p.netWorth,
  lastHits: (p) => p.lastHits,
  denies: (p) => p.denies,
  playerDamage: (p) => p.stats?.playerDamage ?? null,
  damageTaken: (p) => p.stats?.damageTaken ?? null,
  objectiveDamage: (p) => p.stats?.objectiveDamage ?? null,
  healing: (p) => p.stats?.healing ?? null,
};

/** Rang de compétition décroissant : 1, 2, 2, 4. null pour une valeur inconnue. */
export function competitionRanks(values: (number | null)[]): (number | null)[] {
  return values.map((v) =>
    v === null ? null : 1 + values.filter((o) => o !== null && o > v).length,
  );
}

export function applyServerMetrics(detail: MatchDetail): MatchDetail {
  const all = detail.teams.flatMap((t) => t.players);
  const minutes = (detail.durationSeconds ?? 0) / 60;
  for (const p of all) {
    p.kda =
      p.kills === null || p.deaths === null || p.assists === null
        ? null
        : round2((p.kills + p.assists) / Math.max(p.deaths, 1));
    p.lastHitsPerMinute = p.lastHits !== null && minutes > 0 ? round2(p.lastHits / minutes) : null;
  }
  const global = competitionRanks(all.map((p) => p.netWorth));
  all.forEach((p, i) => (p.netWorthRank = global[i] ?? null));
  const known = (get: (p: MatchPlayer) => number | null) =>
    all.length > 0 && all.every((p) => get(p) !== null);
  const topOf = (get: (p: MatchPlayer) => number | null) => {
    if (!known(get)) return new Set<MatchPlayer>();
    const best = Math.max(...all.map((p) => get(p) as number));
    return new Set(all.filter((p) => get(p) === best));
  };
  const richest = topOf((p) => p.netWorth);
  const bestKda = topOf((p) => p.kda ?? null);
  for (const p of all) {
    p.performanceTags = [
      ...(richest.has(p) ? (["match_top_net_worth"] as const) : []),
      ...(bestKda.has(p) ? (["match_best_kda"] as const) : []),
    ];
  }
  for (const t of detail.teams) {
    const ranks = competitionRanks(t.players.map((p) => p.netWorth));
    t.players.forEach((p, i) => (p.teamNetWorthRank = ranks[i] ?? null));
    t.result = detail.winningSide === null ? null : detail.winningSide === t.side ? "win" : "loss";
    const totals = {} as Record<TeamTotalKey, number | null>;
    const knownPlayers: Record<string, number> = {};
    for (const [key, get] of Object.entries(TOTALS) as [
      TeamTotalKey,
      (p: MatchPlayer) => number | null,
    ][]) {
      const vals = t.players.map(get).filter((v): v is number => v !== null);
      knownPlayers[key] = vals.length;
      totals[key] =
        t.players.length > 0 && vals.length === t.players.length
          ? vals.reduce((s, v) => s + v, 0)
          : null;
    }
    t.totals = totals;
    t.totalsCoverage = { players: t.players.length, knownPlayers };
  }
  return detail;
}
