import type { GameMode, MatchMode, MatchSummary } from "@/api";

/** Libellés du jeu : le type de partie (matchmaking) et le format de jeu sont deux axes indépendants. */
export const MATCH_MODE_LABEL: Record<MatchMode, string> = {
  ranked: "Classée",
  unranked: "Normale",
  private_lobby: "Lobby privé",
  coop_bot: "Contre bots",
  hero_labs: "Hero Labs",
  tutorial: "Tutoriel",
  new_player_placement: "Placement",
  server_test: "Test serveur",
};

export const GAME_MODE_LABEL: Record<GameMode, string> = {
  normal: "6 contre 6",
  street_brawl: "Street Brawl",
  sandbox: "Bac à sable",
  "1v1_test": "1 contre 1",
  explore_nyc: "Explore NYC",
};

/** Pastille d'une partie : le format spécial prime (Street Brawl), sinon le type de partie. null si inconnu. */
export function modePill(
  m: Pick<MatchSummary, "matchMode" | "gameMode">,
): { label: string; tone: "ranked" | "normal" | "special" } | null {
  if (m.gameMode && m.gameMode !== "normal")
    return { label: GAME_MODE_LABEL[m.gameMode], tone: "special" };
  if (m.matchMode === "ranked") return { label: MATCH_MODE_LABEL.ranked, tone: "ranked" };
  if (m.matchMode === "unranked") return { label: MATCH_MODE_LABEL.unranked, tone: "normal" };
  if (m.matchMode) return { label: MATCH_MODE_LABEL[m.matchMode], tone: "special" };
  return null;
}

export type ModeKey = "all" | "ranked" | "normal" | "street_brawl";

export const MODE_FILTERS: { value: ModeKey; label: string }[] = [
  { value: "all", label: "Tous les modes" },
  { value: "ranked", label: "Classée" },
  { value: "normal", label: "Normale" },
  { value: "street_brawl", label: "Street Brawl" },
];

/** Appartenance à un filtre de mode : classée = matchMode ranked ; normale = unranked en 6 contre 6 ; Street Brawl = gameMode. */
export function matchesMode(
  m: Pick<MatchSummary, "matchMode" | "gameMode">,
  key: ModeKey,
): boolean {
  if (key === "all") return true;
  if (key === "street_brawl") return m.gameMode === "street_brawl";
  if (key === "ranked") return m.matchMode === "ranked";
  return m.matchMode === "unranked" && (m.gameMode === "normal" || m.gameMode == null);
}

const FORMAT_LABEL: Record<string, string> = {
  normal: "Normal",
  street_brawl: "Street Brawl",
  sandbox: "Bac à sable",
  "1v1_test": "1 contre 1",
  explore_nyc: "Explore NYC",
};
const TYPE_LABEL: Record<string, string> = {
  ranked: "Classée",
  unranked: "Non classée",
  private_lobby: "Lobby privé",
  coop_bot: "Contre bots",
  hero_labs: "Hero Labs",
  tutorial: "Tutoriel",
  new_player_placement: "Placement",
  server_test: "Test serveur",
};

/** Combinaison format x type de partie telle que le back la livre. Valeur inconnue : texte brut, jamais masquée. */
export const modeComboLabel = (gameMode: string, matchMode: string): string =>
  `${FORMAT_LABEL[gameMode] ?? gameMode} · ${TYPE_LABEL[matchMode] ?? matchMode}`;
