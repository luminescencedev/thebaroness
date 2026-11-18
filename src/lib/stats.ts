/**
 * Statistiques dérivées de l'historique de parties. Fonctions pures, jamais dans le rendu.
 * Valeur inconnue : null (jamais 0). Les parties sont du plus récent au plus ancien, sauf mention.
 */
import type { MatchSummary, PlayerHeroStat } from "@/api";

const round = (n: number, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * Rapport KDA brut = (K + A) / max(D, 1), null si une valeur manque. SEULE implémentation de la formule du
 * front : les comparaisons (meilleur KDA, tri) s'appuient dessus sans arrondi, l'affichage passe par `kda`.
 */
export function kdaRatio(k: number | null, d: number | null, a: number | null): number | null {
  if (!isNum(k) || !isNum(d) || !isNum(a)) return null;
  return (k + a) / Math.max(d, 1);
}

/** KDA arrondi à 2 décimales pour l'affichage. */
export function kda(k: number | null, d: number | null, a: number | null): number | null {
  const r = kdaRatio(k, d, a);
  return r === null ? null : round(r);
}

export const matchKda = (m: MatchSummary) => kda(m.kills, m.deaths, m.assists);

/** Valeur nette par minute, null si la valeur ou la durée manque. */
export function netPerMinute(m: MatchSummary): number | null {
  if (!isNum(m.netWorth) || !isNum(m.durationSeconds) || m.durationSeconds <= 0) return null;
  return round(m.netWorth / (m.durationSeconds / 60), 0);
}

export interface HeroRow extends PlayerHeroStat {
  /** Méta mondiale du héros (30 jours, mode normal), fournie par le back. null si indisponible. */
  metaWinRate: number | null;
  /** `winRateVsMeta` du back : taux du joueur moins taux de la méta, en points. Jamais recalculé ici. */
  delta: number | null;
  few: boolean;
}

/** Seuil d'affichage « peu de parties : écart peu fiable » (indication d'interface, pas une règle métier). */
export const FEW_GAMES = 5;

export function heroRows(heroes: PlayerHeroStat[]): HeroRow[] {
  return heroes.map((h) => ({
    ...h,
    metaWinRate: h.globalMeta?.winRate ?? null,
    delta: h.winRateVsMeta ?? null,
    few: h.matches < FEW_GAMES,
  }));
}

export interface CalendarDay {
  /** AAAA-MM-JJ (UTC). */
  date: string;
  count: number;
  wins: number;
  losses: number;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Grille de 12 semaines (lundi en premier, jours en UTC) depuis les jours déjà agrégés par le back (`GET /players/:id/activity`). */
export function calendarFromDays(
  days: { date: string; matches: number; wins: number; losses: number }[],
  weeks = 12,
): CalendarDay[][] {
  const byDay = new Map(
    days.map((d) => [d.date, { date: d.date, count: d.matches, wins: d.wins, losses: d.losses }]),
  );
  const last = days.at(-1)?.date;
  const today = last ? new Date(`${last}T00:00:00Z`) : new Date();
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = new Date(today.getTime() - (mondayOffset + (weeks - 1) * 7) * 86400000);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = dayKey(new Date(start.getTime() + (w * 7 + d) * 86400000));
      return byDay.get(key) ?? { date: key, count: 0, wins: 0, losses: 0 };
    }),
  );
}

/** Échantillonne une série à `max` points en gardant le premier et le dernier. */
export function downsample<T>(items: T[], max = 120): T[] {
  if (items.length <= max) return items;
  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => items[Math.round(i * step)] as T);
}

/** Chiffres romains pour le sous-rang (1 à 6). */
export const ROMAN = ["", "I", "II", "III", "IV", "V", "VI"];
