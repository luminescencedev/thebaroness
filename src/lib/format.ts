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
