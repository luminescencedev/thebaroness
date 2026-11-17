/** Valeur absente : jamais 0 à la place de null. */
export const NA = "n/d";

const number = new Intl.NumberFormat("fr-FR");
const decimal = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export const formatInt = (v: number | null | undefined): string =>
  v === null || v === undefined ? NA : number.format(v);

export const formatDecimal = (v: number | null | undefined): string =>
  v === null || v === undefined ? NA : decimal.format(v);

export const formatPercent = (v: number | null | undefined): string =>
  v === null || v === undefined ? NA : `${decimal.format(v)} %`;

export const formatDate = (iso: string): string => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string): string => dateTimeFmt.format(new Date(iso));

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return NA;
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export const initials = (name: string): string => name.trim().slice(0, 2).toUpperCase() || "?";

const regionNames = new Intl.DisplayNames("fr", { type: "region" });

/** Région d'un joueur : code pays Steam (FR) converti en nom, sinon texte tel quel. */
export function formatRegion(region: string): string {
  if (/^[A-Za-z]{2}$/.test(region)) {
    try {
      return regionNames.of(region.toUpperCase()) ?? region;
    } catch {
      return region;
    }
  }
  return region;
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

/** « il y a 2 min », « hier », « il y a 3 h ». */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "à l'instant";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), "day");
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}

const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
/** 216 867 donne « 216,9 k » : lecture rapide des grands totaux. */
export const formatCompact = (v: number | null | undefined): string =>
  v === null || v === undefined ? NA : compact.format(v);
