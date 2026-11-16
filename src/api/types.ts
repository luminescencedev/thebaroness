/** DTO du backend The Baroness (contrat HTTP v1). Dates ISO 8601 UTC. */

/** Le steamId est toujours une chaîne : ne jamais le convertir en Number. */
export type SteamId = string;

export interface DataMeta {
  fetchedAt: string;
  sourceUpdatedAt: string | null;
  isStale: boolean;
  isPartial: boolean;
}

export interface HealthResponse {
  status: "ok";
}

/** Utilisateur connecté via Steam (OpenID). Aucun email ni mot de passe. */
export interface PublicUser {
  id: string;
  steamId: SteamId;
  displayName: string;
  avatarUrl: string | null;
}

export interface PlayerSummary {
  steamId: SteamId;
  accountId: number;
  displayName: string;
  avatarUrl: string | null;
}

export interface PlayerSearchResponse {
  items: PlayerSummary[];
  meta: DataMeta;
}

export interface PlayerStats {
  matchesPlayed: number | null;
  wins: number | null;
  losses: number | null;
  winRate: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  kda: number | null;
}

export interface PlayerRank {
  badgeId: number | null;
  name: string | null;
}

export interface PlayerProfile {
  /** `region` est un ajout rétrocompatible au contrat v1 (voir docs/decisions.md). */
  player: PlayerSummary & { region?: string | null };
  stats: PlayerStats;
  rank: PlayerRank;
  meta: DataMeta;
}

export type MatchOutcome = "win" | "loss";

export interface MatchSummary {
  matchId: string;
  playedAt: string;
  heroId: number;
  heroName: string;
  outcome: MatchOutcome;
  durationSeconds: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  netWorth: number | null;
}

export interface MatchHistoryResponse {
  items: MatchSummary[];
  /** Jeton opaque, transmis tel quel. */
  nextCursor: string | null;
  meta: DataMeta;
}

export interface MatchHistoryParams {
  limit?: number;
  cursor?: string;
}

export interface TrackedPlayer {
  id: string;
  steamId: SteamId;
  alias: string;
  note: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrackedPlayersResponse {
  items: TrackedPlayer[];
}

export interface CreateTrackedPlayerInput {
  steamId: SteamId;
  alias?: string;
  note?: string;
  tags?: string[];
}

/** steamId, id et ownerId sont interdits en modification. */
export interface UpdateTrackedPlayerInput {
  alias?: string;
  note?: string;
  tags?: string[];
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
