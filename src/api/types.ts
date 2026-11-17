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

/** Type de partie (matchmaking). Indépendant de GameMode : `unranked` est une partie normale, `ranked` une classée. */
export type MatchMode =
  | "unranked"
  | "private_lobby"
  | "coop_bot"
  | "ranked"
  | "server_test"
  | "tutorial"
  | "hero_labs"
  | "new_player_placement";

/** Format de jeu (6 contre 6, Street Brawl...). Indépendant de MatchMode. */
export type GameMode = "normal" | "1v1_test" | "sandbox" | "street_brawl" | "explore_nyc";

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
  /** Livré par le back (v1.7.0). null si inconnu. */
  matchMode?: MatchMode | null;
  /** Livré par le back (v1.7.0). null si inconnu. */
  gameMode?: GameMode | null;
}

/** Scope statistique (v1.9.0) : période et deux axes de mode indépendants. */
export type StatPeriod = "7d" | "30d" | "season";
export type GameModeFilter = "all" | "normal" | "street_brawl";
export type MatchModeFilter = "all" | "ranked" | "unranked";
export type OutcomeFilter = "all" | "win" | "loss";

export interface ProfileScope {
  period: StatPeriod;
  gameMode: GameModeFilter;
  matchMode: MatchModeFilter;
}

/** Filtres effectivement appliqués (null : non filtré). */
export interface AppliedFilters {
  period: StatPeriod | null;
  gameMode: GameModeFilter;
  matchMode: MatchModeFilter;
  heroId: number | null;
  outcome: OutcomeFilter;
}

export interface MatchHistoryResponse {
  items: MatchSummary[];
  /** Jeton opaque lié aux filtres, transmis tel quel avec les MÊMES filtres. */
  nextCursor: string | null;
  /** v1.9.0 : absent d'une copie ancienne. */
  appliedFilters?: AppliedFilters;
  meta: DataMeta;
}

/** Tous les filtres sont optionnels : sans filtre, tout l'historique (comportement v1.8). */
export interface MatchHistoryParams {
  limit?: number;
  cursor?: string;
  period?: StatPeriod;
  gameMode?: GameModeFilter;
  matchMode?: MatchModeFilter;
  heroId?: number;
  outcome?: OutcomeFilter;
}

export type CoverageNote =
  "season_start_unknown" | "unknown_mode_excluded" | "unknown_mode_included" | "history_stale";

export interface OverviewSummary {
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  /** (K + A) / max(D, 1) sur les parties où K, D et A sont connus. */
  kda: number | null;
  kdaSampleSize: number;
  /** Moyenne des ratios par partie, pas total sur total. */
  avgNetWorthPerMinute: number | null;
  netWorthPerMinuteSampleSize: number;
  avgDurationSeconds: number | null;
  durationSampleSize: number;
  lastMatchAt: string | null;
}

export interface OverviewMode {
  gameMode: string;
  matchMode: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface OverviewHero {
  heroId: number;
  heroName: string;
  heroImageUrl: string | null;
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  kda: number | null;
  kdaSampleSize: number;
}

export interface OverviewCoverage {
  requestedFrom: string | null;
  requestedTo: string;
  observedFrom: string | null;
  observedTo: string | null;
  includedMatches: number;
  excludedUnknownMode: number;
  unknownModeMatches: number;
  isPartial: boolean;
  notes: CoverageNote[];
}

/** GET /players/{steamId}/overview (v1.9.0). Le rang officiel reste dans PlayerProfile. */
export interface PlayerOverview {
  filters: ProfileScope;
  summary: OverviewSummary;
  modes: OverviewMode[];
  topHeroes: OverviewHero[];
  coverage: OverviewCoverage;
  meta: DataMeta;
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
  /** v1.9.0 */
  losses: number;
  winRate: number | null;
  kda: number | null;
  /** v1.9.0 : parties utilisées pour le KDA. */
  kdaSampleSize: number;
  /** v1.9.0 : moyenne des ratios par partie. */
  avgNetWorthPerMinute: number | null;
  netWorthPerMinuteSampleSize: number;
}

export interface PlayerHeroesResponse {
  items: PlayerHeroStat[];
  appliedFilters?: AppliedFilters;
  meta: DataMeta;
}

export type LeaderboardRegion = "Europe" | "Asia" | "NAmerica" | "SAmerica" | "Oceania";

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  /** null quand le classement ne permet pas de relier le compte à un SteamID. */
  steamId: SteamId | null;
  /** true : SteamID et rang déduits parmi plusieurs comptes homonymes (v1.8.0). */
  inferred?: boolean;
  /** null : aucun rang connu pour ce joueur. */
  badge: { tier: number; subrank: number; name: string; imageUrl: string | null } | null;
  topHeroes: { heroId: number; name: string; imageUrl: string | null }[];
}

export interface LeaderboardResponse {
  region: LeaderboardRegion;
  items: LeaderboardEntry[];
  meta: DataMeta;
}

export type TeamSide = "amber" | "sapphire";

/** Catégorie d'un objet (slot du catalogue). */
export type ItemCategory = "weapon" | "vitality" | "spirit";

/**
 * Objet du build tel que l'affiche l'interface : `itemId` du détail de partie résolu avec
 * `GET /items` (v1.10.0). Modèle de présentation, pas un DTO.
 */
export interface MatchItem {
  itemId: number;
  name: string;
  /** 1 à 5 (catalogue). */
  tier: number;
  category: ItemCategory;
  iconUrl: string | null;
}

/** Dernier relevé de fin de partie (v1.10.0). Chaque valeur peut être null. */
export interface MatchPlayerStats {
  playerDamage: number | null;
  damageTaken: number | null;
  objectiveDamage: number | null;
  creepDamage: number | null;
  neutralDamage: number | null;
  healing: number | null;
  selfHealing: number | null;
  teammateHealing: number | null;
  damageMitigated: number | null;
  heroBulletsHit: number | null;
  heroBulletsHitCrit: number | null;
  /** Critiques sur balles touchant un héros, en pourcentage. */
  heroCritRate: number | null;
  shotsHit: number | null;
  shotsMissed: number | null;
  /** Précision toutes cibles, en pourcentage. */
  accuracy: number | null;
  headshotKills: number | null;
  creepKills: number | null;
  neutralKills: number | null;
}

export interface MatchPurchase {
  itemId: number;
  atSeconds: number;
  /** null : objet gardé. */
  soldAtSeconds: number | null;
}

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
  /**
   * v1.10.0 (absents sur un back v1.9, d'où `?`) : classement MVP calculé par Valve (1 = meilleur),
   * participation aux éliminations en %, statistiques de fin de partie, achats, objets finaux.
   */
  mvpRank?: number | null;
  killParticipation?: number | null;
  stats?: MatchPlayerStats | null;
  purchases?: MatchPurchase[] | null;
  finalItemIds?: number[] | null;
  abilityUpgrades?: { abilityId: number; atSeconds: number }[] | null;
}

export interface MatchTeam {
  side: TeamSide;
  outcome: MatchOutcome;
  /** v1.10.0 : badge moyen fourni par la source (null si inconnu, fréquent en non classé). */
  averageBadge?: number | null;
  averageRankName?: string | null;
  players: MatchPlayer[];
}

export interface MatchDetail {
  matchId: string;
  playedAt: string | null;
  durationSeconds: number | null;
  /** null : vainqueur inconnu. */
  winningSide: TeamSide | null;
  teams: MatchTeam[];
  matchMode?: MatchMode | null;
  gameMode?: GameMode | null;
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

/* ---------- Phase P1 (OpenAPI 1.10.0) ---------- */

export interface CatalogItem {
  id: number;
  className: string;
  name: string;
  type: "upgrade" | "ability" | "weapon";
  slot: ItemCategory | null;
  tier: number | null;
  cost: number | null;
  isActive: boolean;
  shopable: boolean;
  disabled: boolean;
  heroIds: number[];
  componentIds: number[];
  imageUrl: string | null;
}

export interface ItemListResponse {
  clientVersion: number;
  items: CatalogItem[];
  meta: DataMeta;
}

export interface RankHistoryPoint {
  at: string;
  matchId: string;
  badge: number;
  tier: number;
  subrank: number;
  /** tier * 6 + subrank. */
  score: number;
  name: string;
  imageUrl: string | null;
  outcome: MatchOutcome;
}

export interface RankHistory {
  period: StatPeriod;
  points: RankHistoryPoint[];
  coverage: {
    requestedFrom: string | null;
    requestedTo: string;
    rankedMatches: number;
    pointCount: number;
    /** Parties classées sans badge fourni par la source. */
    missingBadge: number;
    isPartial: boolean;
    notes: string[];
  };
  meta: DataMeta;
}

export interface ActivityDay {
  date: string;
  matches: number;
  wins: number;
  losses: number;
}

export interface PlayerActivity {
  weeks: number;
  filters: { gameMode: GameModeFilter; matchMode: MatchModeFilter };
  days: ActivityDay[];
  summary: { matches: number; wins: number; losses: number; activeDays: number };
  coverage: {
    from: string;
    to: string;
    timezone: string;
    excludedUnknownMode: number;
    notes: string[];
  };
  meta: DataMeta;
}

export interface RelatedPlayer {
  steamId: SteamId;
  displayName: string;
  avatarUrl: string | null;
  matches: number;
  /** Victoires du joueur demandé dans les parties communes. */
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface PlayerRelationships {
  appliedFilters: {
    period: StatPeriod | null;
    gameMode: "normal" | "street_brawl";
    sameParty: boolean;
    minMatches: number;
    limit: number;
  };
  /** null : source indisponible (voir meta.isPartial). */
  teammates: RelatedPlayer[] | null;
  opponents: RelatedPlayer[] | null;
  coverage: { requestedFrom: string | null; notes: string[] };
  meta: DataMeta;
}

/* ---------- Phase P2 (OpenAPI 1.11.0) ---------- */

export interface TrendBlock {
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  kda: number | null;
  kdaSampleSize: number;
  avgNetWorthPerMinute: number | null;
  netWorthPerMinuteSampleSize: number;
  avgDurationSeconds: number | null;
  durationSampleSize: number;
}

/** `recent` = les `size` dernières parties, `previous` = les `size` d'avant (null si pas assez : jamais de comparaison inégale). */
export interface PlayerTrends {
  filters: { size: number; gameMode: GameModeFilter; matchMode: MatchModeFilter };
  recent: TrendBlock;
  previous: TrendBlock | null;
  delta: {
    winRate: number | null;
    kda: number | null;
    avgNetWorthPerMinute: number | null;
  } | null;
  /** Winrate des 10 dernières parties à chaque partie, à partir de la 10e. */
  rolling: { at: string; matchId: string; winRate: number }[];
  coverage: { eligibleMatches: number; rollingWindow: number; notes: string[] };
  meta: DataMeta;
}
