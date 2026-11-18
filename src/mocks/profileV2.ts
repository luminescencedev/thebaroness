/**
 * Mock des routes profil V2 (OpenAPI 1.9.0) : mêmes règles que le back (docs/HANDOFF.md du back).
 * Les parties sont SYNTHETIQUES ; seul le calcul reproduit le contrat réel.
 */
import type {
  AppliedFilters,
  CoverageNote,
  GameModeFilter,
  MatchModeFilter,
  MatchSummary,
  OutcomeFilter,
  OverviewCoverage,
  OverviewHero,
  OverviewMode,
  OverviewSummary,
  PlayerHeroStat,
  StatPeriod,
} from "@/api/types";

/** Horloge du mock : fixe, pour des résultats déterministes quelle que soit la date d'exécution. */
export const MOCK_NOW = Date.parse("2026-11-16T12:00:00.000Z");
export const SEASON_START = Date.parse("2026-11-05T20:00:00.000Z");

export interface ServerFilters {
  period: StatPeriod | null;
  gameMode: GameModeFilter;
  matchMode: MatchModeFilter;
  heroId: number | null;
  outcome: OutcomeFilter;
}

const PERIODS = ["7d", "30d", "season"];
const GAME_MODES = ["all", "normal", "street_brawl"];
const MATCH_MODES = ["all", "ranked", "unranked"];
const OUTCOMES = ["all", "win", "loss"];

/** Lit et valide les filtres comme le back : valeur inconnue = 400. */
export function parseServerFilters(
  q: URLSearchParams,
  defaults: { period: StatPeriod | null },
): { filters: ServerFilters } | { error: string } {
  const enumOf = (name: string, allowed: string[], fallback: string | null) => {
    const raw = q.get(name);
    if (raw === null) return fallback;
    return allowed.includes(raw) ? raw : undefined;
  };
  const period = enumOf("period", PERIODS, defaults.period);
  const gameMode = enumOf("gameMode", GAME_MODES, "all");
  const matchMode = enumOf("matchMode", MATCH_MODES, "all");
  const outcome = enumOf("outcome", OUTCOMES, "all");
  if (period === undefined) return { error: "period invalide." };
  if (gameMode === undefined) return { error: "gameMode invalide." };
  if (matchMode === undefined) return { error: "matchMode invalide." };
  if (outcome === undefined) return { error: "outcome invalide." };
  const heroRaw = q.get("heroId");
  const heroId = heroRaw === null ? null : Number(heroRaw);
  if (heroId !== null && (!Number.isInteger(heroId) || heroId < 1))
    return { error: "heroId doit être un entier positif." };
  return {
    filters: {
      period: period as StatPeriod | null,
      gameMode: gameMode as GameModeFilter,
      matchMode: matchMode as MatchModeFilter,
      heroId,
      outcome: outcome as OutcomeFilter,
    },
  };
}

export const applied = (f: ServerFilters): AppliedFilters => ({ ...f });
export const isUnfiltered = (f: ServerFilters) =>
  f.period === null &&
  f.gameMode === "all" &&
  f.matchMode === "all" &&
  f.heroId === null &&
  f.outcome === "all";

export function periodStart(period: StatPeriod | null): number | null {
  if (period === "7d") return MOCK_NOW - 7 * 86_400_000;
  if (period === "30d") return MOCK_NOW - 30 * 86_400_000;
  if (period === "season") return SEASON_START;
  return null;
}

const modeKnown = (m: MatchSummary) => Boolean(m.gameMode) && Boolean(m.matchMode);

/** Sélection sur tout l'historique, du plus récent au plus ancien (puis matchId décroissant). */
export function selectMatches(all: MatchSummary[], f: ServerFilters): MatchSummary[] {
  const from = periodStart(f.period);
  return all
    .filter((m) => {
      if (from !== null && Date.parse(m.playedAt) < from) return false;
      if (f.gameMode !== "all" && m.gameMode !== f.gameMode) return false;
      if (f.matchMode !== "all" && m.matchMode !== f.matchMode) return false;
      if (f.heroId !== null && m.heroId !== f.heroId) return false;
      if (f.outcome !== "all" && m.outcome !== f.outcome) return false;
      return true;
    })
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt) || b.matchId.localeCompare(a.matchId));
}

/** Curseur lié aux filtres : `c<offset>` sans filtre, `c<offset>~<filtres>` sinon. */
export const filterKey = (f: ServerFilters) => btoa(JSON.stringify(f));
export const makeCursor = (offset: number, f: ServerFilters) =>
  isUnfiltered(f) ? `c${offset}` : `c${offset}~${filterKey(f)}`;
export function readCursor(
  cursor: string,
  f: ServerFilters,
): { offset: number } | { error: string } {
  const m = cursor.match(/^c(\d+)(?:~(.+))?$/);
  if (!m) return { error: "Curseur invalide." };
  const key = m[2];
  if ((key ?? null) !== (isUnfiltered(f) ? null : filterKey(f)))
    return { error: "Curseur obtenu avec d'autres filtres, recommencer sans curseur." };
  return { offset: Number(m[1]) };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const complete = (m: MatchSummary) => m.kills !== null && m.deaths !== null && m.assists !== null;

function kdaOf(list: MatchSummary[]): {
  kda: number | null;
  sample: number;
  k: number;
  d: number;
  a: number;
} {
  const c = list.filter(complete);
  const k = c.reduce((s, m) => s + (m.kills as number), 0);
  const d = c.reduce((s, m) => s + (m.deaths as number), 0);
  const a = c.reduce((s, m) => s + (m.assists as number), 0);
  return { kda: c.length ? round2((k + a) / Math.max(d, 1)) : null, sample: c.length, k, d, a };
}

function npmOf(list: MatchSummary[]): { avg: number | null; sample: number } {
  const v = list
    .filter((m) => m.netWorth !== null && m.durationSeconds !== null && m.durationSeconds > 0)
    .map((m) => (m.netWorth as number) / ((m.durationSeconds as number) / 60));
  return {
    avg: v.length ? round2(v.reduce((s, x) => s + x, 0) / v.length) : null,
    sample: v.length,
  };
}

export function summarize(list: MatchSummary[]): OverviewSummary {
  const wins = list.filter((m) => m.outcome === "win").length;
  const k = kdaOf(list);
  const n = npmOf(list);
  const durs = list.map((m) => m.durationSeconds).filter((d): d is number => d !== null && d > 0);
  return {
    matches: list.length,
    wins,
    losses: list.length - wins,
    winRate: list.length ? round2((wins / list.length) * 100) : null,
    kills: k.sample ? k.k : null,
    deaths: k.sample ? k.d : null,
    assists: k.sample ? k.a : null,
    kda: k.kda,
    kdaSampleSize: k.sample,
    avgNetWorthPerMinute: n.avg,
    netWorthPerMinuteSampleSize: n.sample,
    avgDurationSeconds: durs.length
      ? Math.round(durs.reduce((s, d) => s + d, 0) / durs.length)
      : null,
    durationSampleSize: durs.length,
    lastMatchAt: list[0]?.playedAt ?? null,
  };
}

export function heroStats(list: MatchSummary[]): PlayerHeroStat[] {
  const by = new Map<number, MatchSummary[]>();
  for (const m of list) by.set(m.heroId, [...(by.get(m.heroId) ?? []), m]);
  return [...by.entries()]
    .map(([heroId, ms]) => {
      const wins = ms.filter((m) => m.outcome === "win").length;
      const k = kdaOf(ms);
      const n = npmOf(ms);
      return {
        heroId,
        heroName: ms[0]?.heroName ?? "",
        heroImageUrl: ms[0]?.heroImageUrl ?? null,
        matches: ms.length,
        wins,
        losses: ms.length - wins,
        winRate: round2((wins / ms.length) * 100),
        kda: k.kda,
        kdaSampleSize: k.sample,
        avgNetWorthPerMinute: n.avg,
        netWorthPerMinuteSampleSize: n.sample,
      };
    })
    .sort((a, b) => b.matches - a.matches || a.heroId - b.heroId);
}

export function modesOf(list: MatchSummary[]): OverviewMode[] {
  const by = new Map<string, MatchSummary[]>();
  for (const m of list.filter(modeKnown)) {
    const key = `${m.gameMode}|${m.matchMode}`;
    by.set(key, [...(by.get(key) ?? []), m]);
  }
  return [...by.entries()]
    .map(([key, ms]) => {
      const [gameMode, matchMode] = key.split("|") as [string, string];
      const wins = ms.filter((m) => m.outcome === "win").length;
      return {
        gameMode,
        matchMode,
        matches: ms.length,
        wins,
        losses: ms.length - wins,
        winRate: round2((wins / ms.length) * 100),
      };
    })
    .sort((a, b) => b.matches - a.matches);
}

export function overviewOf(all: MatchSummary[], f: ServerFilters) {
  const list = selectMatches(all, f);
  const unknown =
    f.gameMode === "all" && f.matchMode === "all" ? list.filter((m) => !modeKnown(m)).length : 0;
  const preMode = selectMatches(all, { ...f, gameMode: "all", matchMode: "all" });
  const excluded =
    f.gameMode !== "all" || f.matchMode !== "all" ? preMode.filter((m) => !modeKnown(m)).length : 0;
  const notes: CoverageNote[] = [];
  if (excluded > 0) notes.push("unknown_mode_excluded");
  if (unknown > 0) notes.push("unknown_mode_included");
  const from = periodStart(f.period);
  const coverage: OverviewCoverage = {
    requestedFrom: from === null ? null : new Date(from).toISOString(),
    requestedTo: new Date(MOCK_NOW).toISOString(),
    observedFrom: list.length ? (list[list.length - 1] as MatchSummary).playedAt : null,
    observedTo: list[0]?.playedAt ?? null,
    includedMatches: list.length,
    excludedUnknownMode: excluded,
    unknownModeMatches: unknown,
    isPartial: false,
    notes,
  };
  const topHeroes: OverviewHero[] = heroStats(list)
    .slice(0, 3)
    .map((h) => ({
      heroId: h.heroId,
      heroName: h.heroName,
      heroImageUrl: h.heroImageUrl,
      matches: h.matches,
      wins: h.wins,
      losses: h.losses,
      winRate: h.winRate,
      kda: h.kda,
      kdaSampleSize: h.kdaSampleSize,
    }));
  return { summary: summarize(list), modes: modesOf(list), topHeroes, coverage };
}

/* ---------- Phase P1 (OpenAPI 1.10.0) ---------- */
import type {
  ActivityDay,
  PlayerActivity,
  RankHistory,
  RankHistoryPoint,
  RelatedPlayer,
} from "@/api/types";

/** Un objet par jour UTC jusqu'au « jour courant » du mock ; jour sans partie = 0. */
export function activityOf(
  all: MatchSummary[],
  weeks: number,
  gameMode: GameModeFilter,
  matchMode: MatchModeFilter,
): Omit<PlayerActivity, "meta"> {
  const f: ServerFilters = { period: null, gameMode, matchMode, heroId: null, outcome: "all" };
  const list = selectMatches(all, f);
  const byDay = new Map<string, ActivityDay>();
  for (const m of list) {
    const key = m.playedAt.slice(0, 10);
    const d = byDay.get(key) ?? { date: key, matches: 0, wins: 0, losses: 0 };
    d.matches += 1;
    if (m.outcome === "win") d.wins += 1;
    else d.losses += 1;
    byDay.set(key, d);
  }
  const today = new Date(MOCK_NOW);
  const days: ActivityDay[] = Array.from({ length: weeks * 7 }, (_, i) => {
    const key = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - (weeks * 7 - 1 - i),
      ),
    )
      .toISOString()
      .slice(0, 10);
    return byDay.get(key) ?? { date: key, matches: 0, wins: 0, losses: 0 };
  });
  const sum = (k: "matches" | "wins" | "losses") => days.reduce((n, d) => n + d[k], 0);
  const excluded =
    gameMode !== "all" || matchMode !== "all" ? all.filter((m) => !modeKnown(m)).length : 0;
  return {
    weeks,
    filters: { gameMode, matchMode },
    days,
    summary: {
      matches: sum("matches"),
      wins: sum("wins"),
      losses: sum("losses"),
      activeDays: days.filter((d) => d.matches > 0).length,
    },
    coverage: {
      from: days[0]?.date ?? "",
      to: days[days.length - 1]?.date ?? "",
      timezone: "UTC",
      excludedUnknownMode: excluded,
      notes: excluded > 0 ? ["unknown_mode_excluded"] : [],
    },
  };
}

/** Rang synthétique : marche en arrière depuis le rang actuel, un badge manquant sur trois parties classées. */
export function rankHistoryOf(
  all: MatchSummary[],
  period: StatPeriod,
  current: { tier: number; subrank: number },
  rankName: (tier: number, subrank: number) => { name: string; imageUrl: string | null },
): Omit<RankHistory, "meta"> {
  const ranked = selectMatches(all, {
    period,
    gameMode: "all",
    matchMode: "ranked",
    heroId: null,
    outcome: "all",
  });
  let score = current.tier * 6 + current.subrank;
  const points: RankHistoryPoint[] = [];
  let missing = 0;
  ranked.forEach((m, i) => {
    if (i % 3 === 2) {
      missing += 1;
    } else {
      const tier = Math.floor((score - 1) / 6);
      const subrank = score - tier * 6;
      const r = rankName(tier, subrank);
      points.push({
        at: m.playedAt,
        matchId: m.matchId,
        badge: tier * 10 + subrank,
        tier,
        subrank,
        score,
        name: r.name,
        imageUrl: r.imageUrl,
        outcome: m.outcome,
      });
    }
    score = Math.max(1, score + (m.outcome === "win" ? -(i % 2) : i % 3 === 0 ? 1 : 0));
  });
  const from = periodStart(period);
  return {
    period,
    points: points.reverse(),
    coverage: {
      requestedFrom: from === null ? null : new Date(from).toISOString(),
      requestedTo: new Date(MOCK_NOW).toISOString(),
      rankedMatches: ranked.length,
      pointCount: points.length,
      missingBadge: missing,
      isPartial: false,
      notes: missing > 0 ? ["badge_missing_on_some_ranked_matches"] : [],
    },
  };
}

/** Coéquipiers et adversaires synthétiques (identifiants du mock, liens de profil valides). */
export function relationshipsOf(
  pool: { steamId: string; displayName: string }[],
  limit: number,
  seed: number,
): { teammates: RelatedPlayer[]; opponents: RelatedPlayer[] } {
  const row = (p: { steamId: string; displayName: string }, i: number): RelatedPlayer => {
    const matches = Math.max(2, 14 - i * 2 - (seed % 3));
    const wins = Math.round(matches * (0.7 - i * 0.07));
    return {
      steamId: p.steamId,
      displayName: p.displayName,
      avatarUrl: null,
      matches,
      wins,
      losses: matches - wins,
      winRate: round2((wins / matches) * 100),
    };
  };
  const rows = pool.slice(0, limit * 2).map(row);
  return {
    teammates: rows.filter((_, i) => i % 2 === 0).slice(0, limit),
    opponents: rows.filter((_, i) => i % 2 === 1).slice(0, limit),
  };
}

/* ---------- Phase P2 (OpenAPI 1.11.0) ---------- */
import type { PlayerTrends, TrendBlock, TrendPoint } from "@/api/types";

function trendBlock(list: MatchSummary[]): TrendBlock {
  const s = summarize(list);
  return {
    matches: s.matches,
    wins: s.wins,
    losses: s.losses,
    winRate: s.winRate,
    kills: s.kills,
    deaths: s.deaths,
    assists: s.assists,
    kda: s.kda,
    kdaSampleSize: s.kdaSampleSize,
    avgNetWorthPerMinute: s.avgNetWorthPerMinute,
    netWorthPerMinuteSampleSize: s.netWorthPerMinuteSampleSize,
    avgDurationSeconds: s.avgDurationSeconds,
    durationSampleSize: s.durationSampleSize,
  };
}

/** N dernières contre N précédentes ; `previous` null s'il n'y en a pas N : jamais de comparaison inégale. */
export function trendsOf(
  all: MatchSummary[],
  size: number,
  gameMode: GameModeFilter,
  matchMode: MatchModeFilter,
  period: StatPeriod | null = null,
): Omit<PlayerTrends, "meta"> {
  const list = selectMatches(all, { period, gameMode, matchMode, heroId: null, outcome: "all" });
  const recent = trendBlock(list.slice(0, size));
  const previous = list.length >= size * 2 ? trendBlock(list.slice(size, size * 2)) : null;
  const diff = (a: number | null, b: number | null) =>
    a === null || b === null ? null : Math.round((a - b) * 100) / 100;
  // Du plus ancien au plus récent ; le glissement regarde les 9 parties précédentes DU PÉRIMÈTRE, même hors bloc.
  const chrono = [...list].reverse();
  const rollingAt = (i: number) => {
    const win = chrono.slice(Math.max(0, i - 9), i + 1);
    return {
      rollingWinRate:
        win.length === 10
          ? round2((win.filter((x) => x.outcome === "win").length / 10) * 100)
          : null,
      rollingSampleSize: win.length,
    };
  };
  const block = list.slice(0, size);
  const offset = chrono.length - block.length;
  const series: TrendPoint[] = [...block].reverse().map((m, j) => {
    const mins =
      m.durationSeconds !== null && m.durationSeconds > 0 ? m.durationSeconds / 60 : null;
    return {
      matchId: m.matchId,
      at: m.playedAt,
      heroId: m.heroId,
      win: m.outcome === "win",
      matchMode: m.matchMode ?? null,
      gameMode: m.gameMode ?? null,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
      kda:
        m.kills === null || m.deaths === null || m.assists === null
          ? null
          : round2((m.kills + m.assists) / Math.max(m.deaths, 1)),
      netWorthPerMinute: m.netWorth !== null && mins !== null ? round2(m.netWorth / mins) : null,
      durationSeconds: m.durationSeconds,
      ...rollingAt(offset + j),
    };
  });
  const rolling = chrono
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => i >= 9)
    .slice(-size * 2)
    .map(({ m, i }) => ({
      at: m.playedAt,
      matchId: m.matchId,
      winRate: round2(
        (chrono.slice(i - 9, i + 1).filter((x) => x.outcome === "win").length / 10) * 100,
      ),
    }));
  return {
    filters: { size, gameMode, matchMode, period },
    recent,
    previous,
    delta: previous
      ? {
          winRate: diff(recent.winRate, previous.winRate),
          kda: diff(recent.kda, previous.kda),
          avgNetWorthPerMinute: diff(recent.avgNetWorthPerMinute, previous.avgNetWorthPerMinute),
        }
      : null,
    rolling,
    series,
    coverage: {
      eligibleMatches: list.length,
      rollingWindow: 10,
      notes: previous ? [] : ["insufficient_history"],
      seriesMatches: series.length,
      seriesFrom: series[0]?.at ?? null,
      seriesTo: series.at(-1)?.at ?? null,
      rollingPointsComplete: series.filter((p) => p.rollingWinRate !== null).length,
    },
  };
}
