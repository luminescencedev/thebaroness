/**
 * Statistiques dérivées de l'historique de parties. Fonctions pures, jamais dans le rendu.
 * Valeur inconnue : null (jamais 0). Les parties sont du plus récent au plus ancien, sauf mention.
 */
import type { HeroMetaStats, HeroRole, MatchSummary, PlayerHeroStat } from "@/api";

const round = (n: number, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

export const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2
    ? (s[mid] as number)
    : round(((s[mid - 1] as number) + (s[mid] as number)) / 2);
};

/** KDA = (K + A) / max(D, 1), 2 décimales, null si une valeur manque. */
export function kda(k: number | null, d: number | null, a: number | null): number | null {
  if (!isNum(k) || !isNum(d) || !isNum(a)) return null;
  return round((k + a) / Math.max(d, 1));
}

export const matchKda = (m: MatchSummary) => kda(m.kills, m.deaths, m.assists);

/** Valeur nette par minute, null si la valeur ou la durée manque. */
export function netPerMinute(m: MatchSummary): number | null {
  if (!isNum(m.netWorth) || !isNum(m.durationSeconds) || m.durationSeconds <= 0) return null;
  return round(m.netWorth / (m.durationSeconds / 60), 0);
}

export interface Aggregate {
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  kills: number;
  deaths: number;
  assists: number;
  /** KDA global : sommes, jamais la moyenne des ratios. */
  kda: number | null;
  avgDuration: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  medianDuration: number | null;
  avgNetPerMinute: number | null;
}

export function aggregate(matches: MatchSummary[]): Aggregate {
  const wins = matches.filter((m) => m.outcome === "win").length;
  const complete = matches.filter((m) => isNum(m.kills) && isNum(m.deaths) && isNum(m.assists));
  const kills = complete.reduce((s, m) => s + (m.kills as number), 0);
  const deaths = complete.reduce((s, m) => s + (m.deaths as number), 0);
  const assists = complete.reduce((s, m) => s + (m.assists as number), 0);
  const durations = matches.map((m) => m.durationSeconds).filter(isNum);
  const npm = matches.map(netPerMinute).filter(isNum);
  return {
    matches: matches.length,
    wins,
    losses: matches.length - wins,
    winRate: matches.length ? round((wins / matches.length) * 100) : null,
    kills,
    deaths,
    assists,
    kda: complete.length ? kda(kills, deaths, assists) : null,
    avgDuration: durations.length
      ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length)
      : null,
    minDuration: durations.length ? Math.min(...durations) : null,
    maxDuration: durations.length ? Math.max(...durations) : null,
    medianDuration: median(durations) === null ? null : Math.round(median(durations) as number),
    avgNetPerMinute: npm.length ? Math.round(npm.reduce((s, v) => s + v, 0) / npm.length) : null,
  };
}

/** Victoires glissantes sur `window` parties, du plus ancien au plus récent. Défini à partir de la 5e partie. */
export function rollingWinRate(
  matches: MatchSummary[],
  window = 10,
): { index: number; value: number | null }[] {
  const chrono = [...matches].reverse();
  return chrono.map((_, i) => {
    const slice = chrono.slice(Math.max(0, i - window + 1), i + 1);
    if (i < 4) return { index: i, value: null };
    const wins = slice.filter((m) => m.outcome === "win").length;
    return { index: i, value: round((wins / slice.length) * 100, 1) };
  });
}

export interface RecentDelta {
  winRate: number | null;
  kda: number | null;
  netPerMinute: number | null;
}

/** Les 20 dernières parties contre les 20 précédentes. null sous 5 parties de comparaison. */
export function recentDelta(matches: MatchSummary[], size = 20): RecentDelta | null {
  const recent = matches.slice(0, size);
  const before = matches.slice(size, size * 2);
  if (recent.length < 5 || before.length < 5) return null;
  const a = aggregate(recent);
  const b = aggregate(before);
  const diff = (x: number | null, y: number | null, digits = 2) =>
    x === null || y === null ? null : round(x - y, digits);
  return {
    winRate: diff(a.winRate, b.winRate, 1),
    kda: diff(a.kda, b.kda),
    netPerMinute: diff(a.avgNetPerMinute, b.avgNetPerMinute, 0),
  };
}

export interface Streaks {
  current: { type: "win" | "loss"; length: number } | null;
  bestWin: number;
}

export function streaks(matches: MatchSummary[]): Streaks {
  const first = matches[0];
  let current: Streaks["current"] = null;
  if (first) {
    let length = 0;
    for (const m of matches) {
      if (m.outcome !== first.outcome) break;
      length += 1;
    }
    current = { type: first.outcome, length };
  }
  let best = 0;
  let run = 0;
  for (const m of [...matches].reverse()) {
    run = m.outcome === "win" ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, bestWin: best };
}

export interface RoleRow {
  role: HeroRole | "unknown";
  matches: number;
  wins: number;
}

/** Parties regroupées par rôle du héros (catalogue). Héros absent du catalogue : « unknown ». */
export function rolesPlayed(
  matches: MatchSummary[],
  roleOf: (heroId: number) => HeroRole | undefined,
): RoleRow[] {
  const map = new Map<RoleRow["role"], RoleRow>();
  for (const m of matches) {
    const role = roleOf(m.heroId) ?? "unknown";
    const row = map.get(role) ?? { role, matches: 0, wins: 0 };
    row.matches += 1;
    if (m.outcome === "win") row.wins += 1;
    map.set(role, row);
  }
  return [...map.values()].sort((a, b) => b.matches - a.matches);
}

export interface HeroRow extends PlayerHeroStat {
  metaWinRate: number | null;
  /** Taux du joueur moins taux de la méta, en points. null si la méta est absente. */
  delta: number | null;
  few: boolean;
}

export const FEW_GAMES = 5;

export function heroRows(
  heroes: PlayerHeroStat[],
  meta: Map<number, HeroMetaStats["winRate"]>,
): HeroRow[] {
  return heroes.map((h) => {
    const metaWinRate = meta.get(h.heroId) ?? null;
    return {
      ...h,
      metaWinRate,
      delta: h.winRate !== null && metaWinRate !== null ? round(h.winRate - metaWinRate, 1) : null,
      few: h.matches < FEW_GAMES,
    };
  });
}

export const KDA_BINS = [
  { label: "0 à 1", from: 0, to: 1 },
  { label: "1 à 2", from: 1, to: 2 },
  { label: "2 à 3", from: 2, to: 3 },
  { label: "3 à 4", from: 3, to: 4 },
  { label: "4 à 6", from: 4, to: 6 },
  { label: "6 à 8", from: 6, to: 8 },
  { label: "8 et plus", from: 8, to: Infinity },
];

/** Index de la classe de KDA qui contient la valeur. */
export const kdaBinIndex = (value: number): number =>
  KDA_BINS.findIndex((b) => value >= b.from && value < b.to);

export function kdaDistribution(matches: MatchSummary[]): {
  bins: { label: string; count: number }[];
  median: number | null;
} {
  const values = matches.map(matchKda).filter(isNum);
  return {
    bins: KDA_BINS.map((b) => ({
      label: b.label,
      count: values.filter((v) => v >= b.from && v < b.to).length,
    })),
    median: median(values),
  };
}

export const DURATION_BUCKETS = [
  { label: "Moins de 28 min", from: 0, to: 28 },
  { label: "28 à 35 min", from: 28, to: 35 },
  { label: "35 à 42 min", from: 35, to: 42 },
  { label: "42 min et plus", from: 42, to: Infinity },
];

export function winRateByDuration(
  matches: MatchSummary[],
): { label: string; matches: number; winRate: number | null }[] {
  return DURATION_BUCKETS.map((b) => {
    const inBucket = matches.filter(
      (m) =>
        isNum(m.durationSeconds) &&
        m.durationSeconds / 60 >= b.from &&
        m.durationSeconds / 60 < b.to,
    );
    const wins = inBucket.filter((m) => m.outcome === "win").length;
    return {
      label: b.label,
      matches: inBucket.length,
      winRate: inBucket.length ? round((wins / inBucket.length) * 100, 1) : null,
    };
  });
}

export interface CalendarDay {
  /** AAAA-MM-JJ (UTC). */
  date: string;
  count: number;
  wins: number;
  losses: number;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** 12 semaines se terminant par la semaine de `now`, lundi en premier, jours en UTC. */
export function calendar(matches: MatchSummary[], now = new Date(), weeks = 12): CalendarDay[][] {
  const byDay = new Map<string, CalendarDay>();
  for (const m of matches) {
    const key = m.playedAt.slice(0, 10);
    const day = byDay.get(key) ?? { date: key, count: 0, wins: 0, losses: 0 };
    day.count += 1;
    if (m.outcome === "win") day.wins += 1;
    else day.losses += 1;
    byDay.set(key, day);
  }
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = new Date(today.getTime() - (mondayOffset + (weeks - 1) * 7) * 86400000);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = dayKey(new Date(start.getTime() + (w * 7 + d) * 86400000));
      return byDay.get(key) ?? { date: key, count: 0, wins: 0, losses: 0 };
    }),
  );
}

/** Parties par heure locale (Europe/Paris par défaut), et heure la plus active. */
export function hourDistribution(
  matches: MatchSummary[],
  timeZone = "Europe/Paris",
): { counts: number[]; peak: number | null } {
  const fmt = new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone });
  const counts = Array.from({ length: 24 }, () => 0);
  for (const m of matches) {
    const h = Number.parseInt(fmt.format(new Date(m.playedAt)), 10);
    if (Number.isInteger(h) && h >= 0 && h < 24) counts[h] = (counts[h] ?? 0) + 1;
  }
  const max = Math.max(...counts);
  return { counts, peak: max > 0 ? counts.indexOf(max) : null };
}

/** Échantillonne une série à `max` points en gardant le premier et le dernier. */
export function downsample<T>(items: T[], max = 120): T[] {
  if (items.length <= max) return items;
  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => items[Math.round(i * step)] as T);
}

export interface ModeRow {
  key: "ranked" | "normal" | "street_brawl";
  label: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

/** Bilan par mode sur les parties fournies. Les parties sans mode connu ne sont comptées dans aucune ligne. */
export function modeBreakdown(matches: MatchSummary[]): { rows: ModeRow[]; unknown: number } {
  const defs: { key: ModeRow["key"]; label: string; test: (m: MatchSummary) => boolean }[] = [
    { key: "ranked", label: "Classée", test: (m) => m.matchMode === "ranked" },
    {
      key: "normal",
      label: "Normale",
      test: (m) => m.matchMode === "unranked" && (m.gameMode === "normal" || m.gameMode == null),
    },
    { key: "street_brawl", label: "Street Brawl", test: (m) => m.gameMode === "street_brawl" },
  ];
  const rows = defs.map((d) => {
    const list = matches.filter(d.test);
    const wins = list.filter((m) => m.outcome === "win").length;
    return {
      key: d.key,
      label: d.label,
      matches: list.length,
      wins,
      losses: list.length - wins,
      winRate: list.length ? round((wins / list.length) * 100, 1) : null,
    };
  });
  const unknown = matches.filter((m) => m.matchMode == null && m.gameMode == null).length;
  return { rows, unknown };
}

/** Chiffres romains pour le sous-rang (1 à 6). */
export const ROMAN = ["", "I", "II", "III", "IV", "V", "VI"];
