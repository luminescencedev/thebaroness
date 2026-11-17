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
