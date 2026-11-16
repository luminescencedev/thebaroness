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

export interface PlayerProfile {
  /** `region` : code pays Steam (ex. FR), null si inconnu. Fourni par le back. */
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
  /** Ajout optionnel : portrait du héros fourni par le back. */
  heroImageUrl?: string | null;
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

/* ---------- P1 : catalogue, classement, détail de match ---------- */
/* Contrat proposé par le front (voir docs/back-p1-contract.md). Les images viennent du
   catalogue Deadlock normalisé par le back : le front ne les construit jamais lui-même. */

export type HeroRole = "assassin" | "brawler" | "marksman" | "mystic" | "healer";

export interface HeroImages {
  card: string;
  small: string;
  vertical: string;
  background: string;
  name: string | null;
}

export interface HeroAbility {
  id: number;
  name: string;
  imageUrl: string | null;
  type: "signature" | "ultimate";
  description: string;
  cooldownSeconds: number | null;
}

export interface HeroStatLine {
  key: string;
  label: string;
  value: number;
}

export interface HeroSummary {
  id: number;
  name: string;
  role: HeroRole;
  gunTag: string | null;
  complexity: number | null;
  tags: string[];
  /** Couleur d'accent du héros, hexadécimale. */
  color: string;
  images: HeroImages;
}

export interface HeroDetail extends HeroSummary {
  lore: string;
  stats: HeroStatLine[];
  abilities: HeroAbility[];
}

export interface HeroListResponse {
  items: HeroSummary[];
  meta: DataMeta;
}

export interface HeroDetailResponse {
  hero: HeroDetail;
  meta: DataMeta;
}

export interface HeroMetaStats {
  heroId: number;
  matches: number | null;
  winRate: number | null;
  pickRate: number | null;
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  /** Taux de victoire par palier de rang (0 à 11), null si l'échantillon est trop faible. */
  winRateByTier: { tier: number; winRate: number | null; matches: number | null }[];
}

export interface HeroStatsResponse {
  stats: HeroMetaStats;
  meta: DataMeta;
}

export interface RankTier {
  tier: number;
  name: string;
  color: string;
  imageUrl: string;
  /** Images des 6 sous-rangs (index 0 = sous-rang 1), null si indisponible. */
  subranks: (string | null)[];
}

export interface RankListResponse {
  items: RankTier[];
}

/** Rang d'un joueur : `badgeId` et `name` sont inchangés, le reste est un ajout optionnel. */
export interface PlayerRank {
  badgeId: number | null;
  name: string | null;
  tier?: number | null;
  subrank?: number | null;
  imageUrl?: string | null;
  color?: string | null;
}

export interface PlayerHeroStat {
  heroId: number;
  heroName: string;
  heroImageUrl: string | null;
  matches: number;
  wins: number;
  winRate: number | null;
  kda: number | null;
}

export interface PlayerHeroesResponse {
  items: PlayerHeroStat[];
  meta: DataMeta;
}

export type LeaderboardRegion = "Europe" | "Asia" | "NAmerica" | "SAmerica" | "Oceania";

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  /** null quand le classement ne permet pas de relier le compte à un SteamID. */
  steamId: SteamId | null;
  /** null : le classement de Deadlock API ne donne pas le rang du joueur. */
  badge: { tier: number; subrank: number; name: string; imageUrl: string | null } | null;
  topHeroes: { heroId: number; name: string; imageUrl: string | null }[];
}

export interface LeaderboardResponse {
  region: LeaderboardRegion;
  items: LeaderboardEntry[];
  meta: DataMeta;
}

export type TeamSide = "amber" | "sapphire";

export interface MatchPlayer {
  steamId: SteamId | null;
  displayName: string;
  heroId: number;
  heroName: string;
  heroImageUrl: string | null;
  level: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  netWorth: number | null;
  lastHits: number | null;
  denies: number | null;
}

export interface MatchTeam {
  side: TeamSide;
  outcome: MatchOutcome;
  players: MatchPlayer[];
}

export interface MatchDetail {
  matchId: string;
  playedAt: string | null;
  durationSeconds: number | null;
  /** null : vainqueur inconnu. */
  winningSide: TeamSide | null;
  teams: MatchTeam[];
}

export interface MatchDetailResponse {
  match: MatchDetail;
  meta: DataMeta;
}

export interface MapAssets {
  minimap: string;
  tunnels: string | null;
  frame: string | null;
}

/* ---------- Groupes et comparaison (proposition du front, voir docs/back-groups-contract.md) ---------- */

export type ComparePeriod = "7d" | "30d" | "season";

export interface Group {
  id: string;
  name: string;
  steamIds: SteamId[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupsResponse {
  items: Group[];
}

export interface GroupInput {
  /** 1 à 60 caractères. */
  name: string;
  /** 2 à 20 SteamID64 uniques. */
  steamIds: SteamId[];
}

export interface RankPoint {
  at: string;
  /** tier * 6 + sous-rang (1 à 6) : maximum 72 (Éternus 6). Comparable d'un joueur à l'autre. */
  score: number;
}

export interface BestMatch {
  matchId: string;
  playedAt: string;
  heroName: string;
  heroImageUrl: string | null;
  kills: number;
  deaths: number;
  assists: number;
  netWorth: number | null;
  kda: number | null;
}

export interface GroupMemberStats {
  steamId: SteamId;
  displayName: string;
  avatarUrl: string | null;
  rank: PlayerRank | null;
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  kda: number | null;
  longestWinStreak: number;
  /** Meilleure partie de la période par KDA, null si aucune partie. */
  bestMatch: BestMatch | null;
  /** Historique de rang sur la période, du plus ancien au plus récent. */
  rankHistory: RankPoint[];
}

export interface GroupCompareResponse {
  group: Group;
  period: ComparePeriod;
  members: GroupMemberStats[];
  meta: DataMeta;
}
