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

/** v1.12.0 : une carte par suivi (profil minimal, rang, forme sur 10 parties), échec isolé par ligne. */
export type TrackedInsightStatus = "ok" | "partial" | "not_found" | "unavailable";

export interface TrackedInsight {
  trackedPlayerId: string;
  steamId: SteamId;
  alias: string;
  tags: string[];
  status: TrackedInsightStatus;
  player: { displayName: string; avatarUrl: string | null } | null;
  /** « Non classé » (champs null) si aucune partie classée ; null si inconnu. */
  rank: PlayerRank | null;
  lastMatchAt: string | null;
  form: {
    /** Du plus récent au plus ancien. */
    results: ("win" | "loss")[];
    matchIds: string[];
    wins: number;
    losses: number;
    winRate: number | null;
    sampleSize: number;
    requestedSize: 10;
  } | null;
  meta: DataMeta | null;
  error: { code: string; message: string } | null;
}

export interface TrackedInsightsResponse {
  items: TrackedInsight[];
  /** Nombre de suivis du compte. */
  total: number;
  /** true au-delà de 100 suivis. */
  truncated: boolean;
  meta: DataMeta;
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

/** v1.14.0 : méta de plusieurs héros en une requête (mêmes valeurs que `/heroes/:id/stats`, même cache côté back). */
export interface HeroMetaBatch {
  /** Un `HeroMetaStats` par héros jouable demandé, dans l'ordre demandé ; valeurs null sans donnée. */
  items: HeroMetaStats[];
  /** Ids inconnus ou non jouables (pas de 404). */
  unknownHeroIds: number[];
  /** Fenêtre fixée par la source. */
  scope: { period: "30d"; gameMode: "normal"; matchMode: "all" };
  coverage: { requested: number; known: number; withStats: number };
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
  /** v1.12.0 : méta mondiale du héros (30 jours, mode normal), null si indisponible. */
  globalMeta?: { matches: number | null; winRate: number | null; pickRate: number | null } | null;
  /** v1.12.0 : winRate du joueur moins `globalMeta.winRate`, en points. */
  winRateVsMeta?: number | null;
}

/** v1.12.0 : périmètre de la méta. `comparable` : le joueur est filtré sur le même périmètre (30d, normal, tous types). */
export interface HeroMetaContext {
  period: "30d";
  gameMode: "normal";
  matchMode: "all";
  comparable: boolean;
  fetchedAt: string;
  isStale: boolean;
}

export interface PlayerHeroesResponse {
  items: PlayerHeroStat[];
  /** null : méta indisponible (`globalMeta` null partout). Absent d'un back plus ancien. */
  metaContext?: HeroMetaContext | null;
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
  /** v1.12.0 : avatar Steam, null si inconnu. */
  avatarUrl?: string | null;
  /** null : aucun rang connu pour ce joueur (y compris sur son profil : plus de relecture nécessaire). */
  badge: {
    tier: number;
    subrank: number;
    name: string;
    imageUrl: string | null;
    /** v1.12.0 */
    badgeId?: number | null;
    color?: string | null;
  } | null;
  topHeroes: { heroId: number; name: string; imageUrl: string | null }[];
}

/** v1.12.0 : couverture des identités résolues par le serveur. */
export interface LeaderboardCoverage {
  entries: number;
  withSteamId: number;
  inferredSteamId: number;
  withBadge: number;
  withAvatar: number;
  ranksComplete: boolean;
}

export interface LeaderboardResponse {
  region: LeaderboardRegion;
  items: LeaderboardEntry[];
  coverage?: LeaderboardCoverage;
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
  /** null : heure de l'achat inconnue de la source. */
  atSeconds: number | null;
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
  abilityUpgrades?: { abilityId: number; atSeconds: number | null }[] | null;
  /**
   * v1.12.0 (absents d'un back plus ancien, d'où `?`) : métriques calculées par le back à la lecture.
   * `netWorthRank` : 1 à 12 dans la partie, ex æquo partagés (1, 2, 2, 4) ; `teamNetWorthRank` : dans l'équipe.
   * `performanceTags` : distinctions calculées par The Baroness (différentes de `mvpRank`, qui est celui de Valve).
   */
  kda?: number | null;
  netWorthRank?: number | null;
  teamNetWorthRank?: number | null;
  lastHitsPerMinute?: number | null;
  performanceTags?: PerformanceTag[];
}

export type PerformanceTag = "match_top_net_worth" | "match_best_kda";

export type TeamTotalKey =
  | "kills"
  | "deaths"
  | "assists"
  | "netWorth"
  | "lastHits"
  | "denies"
  | "playerDamage"
  | "damageTaken"
  | "objectiveDamage"
  | "healing";

export interface MatchTeam {
  side: TeamSide;
  outcome: MatchOutcome;
  /** v1.12.0 : null si le vainqueur est inconnu (`outcome` reste « loss » dans ce cas). */
  result?: "win" | "loss" | null;
  /** v1.12.0 : un total vaut null dès qu'un joueur de l'équipe n'a pas la valeur. */
  totals?: Record<TeamTotalKey, number | null>;
  totalsCoverage?: { players: number; knownPlayers: Record<string, number> };
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
  /** v1.12.0 : badge de la source pour ce point. */
  badge?: number;
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
  /** v1.12.0 (absents d'un back plus ancien) : valeurs calculées par le back. */
  kdaSampleSize?: number;
  /** tier * 6 + sous-rang de `rank`, null si inconnu. */
  currentRankScore?: number | null;
  /** Dernier moins premier score de `rankHistory` ; null sous 2 points (pas 0). */
  rankDelta?: number | null;
}

export type HighlightKey =
  | "biggest_climb"
  | "best_win_rate"
  | "most_wins"
  | "best_kda"
  | "longest_win_streak"
  | "best_match";

/** v1.12.0 : titre de la période, calculé par le back (tous les ex æquo, jamais départagés par le nom). */
export interface GroupHighlight {
  key: HighlightKey;
  /** Ordre du groupe ; [] si personne n'est éligible. */
  steamIds: SteamId[];
  value: number | null;
  /** `best_match` seulement. */
  matchId: string | null;
  eligibleMembers: number;
  /** 5 pour `best_win_rate` et `best_kda`, 0 sinon. */
  minMatches: number;
}

export interface GroupCompareResponse {
  group: Group;
  period: ComparePeriod;
  members: GroupMemberStats[];
  /** Toujours 6 entrées dans l'ordre de `HighlightKey`. Absent d'un back plus ancien. */
  highlights?: GroupHighlight[];
  methodology?: {
    periodFrom: string | null;
    rankScore: string;
    kda: string;
    highlightMinMatches: number;
    ties: string;
  };
  meta: DataMeta;
}

/* ---------- Phase P1 (OpenAPI 1.10.0) ---------- */

export interface CatalogItem {
  id: number;
  className: string;
  name: string | null;
  type: "upgrade" | "ability" | "weapon" | null;
  slot: ItemCategory | null;
  tier: number | null;
  cost: number | null;
  isActive: boolean | null;
  shopable: boolean;
  disabled: boolean;
  heroIds: number[];
  componentIds: number[];
  imageUrl: string | null;
}

export interface ItemListResponse {
  clientVersion: number | null;
  items: CatalogItem[];
  meta: DataMeta;
}

export interface ItemDetailResponse {
  clientVersion: number | null;
  item: CatalogItem;
  meta: DataMeta;
}

/* ---------- Phase P2 (OpenAPI 1.11.0) : statistiques d'items, builds, paires ---------- */

export type AnalyticsPeriod = "7d" | "30d";
export type AnalyticsMatchMode = "ranked" | "unranked";

export interface AnalyticsParams {
  period: AnalyticsPeriod;
  /** Absent : tous types de partie. */
  matchMode?: AnalyticsMatchMode;
  heroId?: number;
}

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  heroId: number | null;
  matchMode: "all" | "ranked" | "unranked";
  gameMode: "normal";
  from: string;
}

export interface ItemStats {
  itemId: number;
  /** Parties où l'item a été acheté (pas un taux de choix : le dénominateur n'est pas fourni). */
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
  players: number | null;
  sold: number | null;
  sellRate: number | null;
  avgBuyTimeSeconds: number | null;
  avgSellTimeSeconds: number | null;
}

export interface ItemStatsListResponse {
  filters: AnalyticsFilters;
  items: ItemStats[];
  meta: DataMeta;
}

export interface ItemStatsResponse {
  itemId: number;
  filters: AnalyticsFilters;
  stats: ItemStats | null;
  notes: "below_source_threshold"[];
  meta: DataMeta;
}

export interface HeroBuildCategory {
  name: string | null;
  description: string | null;
  items: { itemId: number; annotation: string | null }[];
}

export interface HeroBuild {
  buildId: number;
  heroId: number;
  name: string | null;
  description: string | null;
  authorSteamId: string | null;
  language: number | null;
  version: number | null;
  publishedAt: string | null;
  updatedAt: string | null;
  /** Rempli seulement avec sort=favorites. null n'est pas zéro. */
  favorites: number | null;
  /** Rempli seulement avec sort=weekly_favorites. */
  weeklyFavorites: number | null;
  categories: HeroBuildCategory[];
}

export type BuildSort = "favorites" | "weekly_favorites" | "updated_at" | "published_at";

export interface HeroBuildsResponse {
  heroId: number;
  sort: string;
  items: HeroBuild[];
  meta: DataMeta;
}

export interface ItemPair {
  itemIds: [number, number];
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface HeroItemPairsResponse {
  heroId: number;
  filters: Omit<AnalyticsFilters, "heroId"> & { itemId: number | null };
  items: ItemPair[];
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

/** Une partie de la série de tendance (back v1.12.0). Valeurs calculées par le back, jamais recalculées. */
export interface TrendPoint {
  matchId: string;
  at: string;
  heroId: number;
  win: boolean;
  matchMode: string | null;
  gameMode: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  /** (K + A) / max(D, 1), 2 décimales. */
  kda: number | null;
  netWorthPerMinute: number | null;
  durationSeconds: number | null;
  /** % sur cette partie et les 9 précédentes du périmètre ; null s'il en manque. */
  rollingWinRate: number | null;
  rollingSampleSize: number;
}

/** `recent` = les `size` dernières parties, `previous` = les `size` d'avant (null si pas assez : jamais de comparaison inégale). */
export interface PlayerTrends {
  filters: {
    size: number;
    gameMode: GameModeFilter;
    matchMode: MatchModeFilter;
    /** v1.12.0 : null sans `period` (tout l'historique). */
    period?: StatPeriod | null;
  };
  recent: TrendBlock;
  previous: TrendBlock | null;
  delta: {
    winRate: number | null;
    kda: number | null;
    avgNetWorthPerMinute: number | null;
  } | null;
  /** Winrate des 10 dernières parties à chaque partie, à partir de la 10e. */
  rolling: { at: string; matchId: string; winRate: number }[];
  /** v1.12.0 (absente d'un back plus ancien) : une entrée par partie du bloc récent, du plus ancien au plus récent. */
  series?: TrendPoint[];
  coverage: {
    eligibleMatches: number;
    rollingWindow: number;
    notes: string[];
    seriesMatches?: number;
    seriesFrom?: string | null;
    seriesTo?: string | null;
    rollingPointsComplete?: number;
  };
  meta: DataMeta;
}
