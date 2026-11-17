import type { OverviewCoverage, ProfileScope } from "@/api";
import { formatDate } from "@/lib/format";
import { GAME_MODES, MATCH_MODES, PERIODS } from "../scope";

export const periodLong = (s: ProfileScope) =>
  PERIODS.find((p) => p.value === s.period)?.long ?? "";

/** « 30 derniers jours · Normal · Classée » : le périmètre, en clair, pour les titres de widgets. */
export function scopeLabel(s: ProfileScope): string {
  const parts = [periodLong(s)];
  if (s.gameMode !== "all")
    parts.push(GAME_MODES.find((o) => o.value === s.gameMode)?.label ?? s.gameMode);
  if (s.matchMode !== "all")
    parts.push(MATCH_MODES.find((o) => o.value === s.matchMode)?.label ?? s.matchMode);
  return parts.join(" · ");
}

/** Avertissements de couverture : jamais passés sous silence, jamais déguisés en période respectée. */
export function coverageMessages(c: OverviewCoverage, s: ProfileScope): string[] {
  const out: string[] = [];
  if (
    c.notes.includes("season_start_unknown") ||
    (s.period === "season" && c.requestedFrom === null)
  )
    out.push(
      "Début de saison inconnu : aucune borne de période n'a été appliquée, les chiffres couvrent tout l'historique disponible.",
    );
  if (c.excludedUnknownMode > 0)
    out.push(
      `${c.excludedUnknownMode} partie${c.excludedUnknownMode > 1 ? "s" : ""} au mode inconnu écartée${c.excludedUnknownMode > 1 ? "s" : ""} par ce filtre.`,
    );
  if (c.unknownModeMatches > 0)
    out.push(
      `${c.unknownModeMatches} partie${c.unknownModeMatches > 1 ? "s" : ""} au mode inconnu comptée${c.unknownModeMatches > 1 ? "s" : ""} dans le total mais absente${c.unknownModeMatches > 1 ? "s" : ""} du détail par mode.`,
    );
  if (c.notes.includes("history_stale"))
    out.push("Historique ancien : la dernière lecture de la source n'est pas récente.");
  return out;
}

export const observedRange = (c: OverviewCoverage): string | null =>
  c.observedFrom && c.observedTo
    ? `Parties du ${formatDate(c.observedFrom)} au ${formatDate(c.observedTo)}`
    : null;
