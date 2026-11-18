import type {
  CatalogItem,
  MatchDetail,
  MatchPlayer,
  MatchPurchase,
  MatchTeam,
  TeamSide,
  TeamTotalKey,
} from "@/api";

/**
 * Modèle de présentation de la page partie. Les métriques (KDA, rangs de souls, participation, totaux et
 * résultat d'équipe) sont CALCULÉES PAR LE BACK (v1.12.0) et lues telles quelles : ce module ne fait que du tri,
 * de la sélection et de la mise en forme. Une valeur absente reste null (« n/d »), jamais 0.
 */
export interface BoardPlayer {
  /** Clé stable : équipe + position d'origine, indépendante du tri et du SteamID (parfois absent). */
  key: string;
  side: TeamSide;
  player: MatchPlayer;
  /** `kda` du back. */
  kda: number | null;
  /** `killParticipation` du back, en %. */
  kp: number | null;
  mvp: boolean;
  /** `netWorthRank` du back : 1 = plus riche de la partie, ex æquo partagés. */
  netRank: number | null;
}

export interface BoardTeam {
  side: TeamSide;
  averageRankName: string | null;
  /** `result` du back : "unknown" quand le vainqueur est inconnu (jamais deux défaites). */
  result: "win" | "loss" | "unknown";
  totals: MatchTeam["totals"] | null;
  totalsCoverage: MatchTeam["totalsCoverage"] | null;
  players: BoardPlayer[];
}

export type SortKey = "net" | "damage" | "kda";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "net", label: "Souls" },
  { value: "damage", label: "Dégâts" },
  { value: "kda", label: "KDA" },
];

/** Total d'équipe du back : null dès qu'un joueur n'a pas la valeur ; `known / of` dit combien la connaissaient. */
export interface TeamTotal {
  value: number | null;
  known: number;
  of: number;
  complete: boolean;
}

export function teamTotal(team: BoardTeam, key: TeamTotalKey): TeamTotal {
  const value = team.totals?.[key] ?? null;
  return {
    value,
    known: team.totalsCoverage?.knownPlayers[key] ?? 0,
    of: team.totalsCoverage?.players ?? team.players.length,
    complete: value !== null,
  };
}

const SIDES: TeamSide[] = ["amber", "sapphire"];

/** Équipes dans l'ordre fixe Hidden King puis Archmother, avec les valeurs du back. */
export function buildBoard(match: MatchDetail): BoardTeam[] {
  return SIDES.flatMap((side) => {
    const team = match.teams.find((t) => t.side === side);
    if (!team) return [];
    return [
      {
        side,
        averageRankName: team.averageRankName ?? null,
        result: resultOf(match, team),
        totals: team.totals ?? null,
        totalsCoverage: team.totalsCoverage ?? null,
        players: team.players.map((player, i) => ({
          key: `${side}:${i}`,
          side,
          player,
          kda: player.kda ?? null,
          kp: player.killParticipation ?? null,
          mvp: player.mvpRank === 1,
          netRank: player.netWorthRank ?? null,
        })),
      },
    ];
  });
}

const sortValue = (b: BoardPlayer, key: SortKey): number | null =>
  key === "net"
    ? b.player.netWorth
    : key === "damage"
      ? (b.player.stats?.playerDamage ?? null)
      : b.kda;

/** Tri décroissant, valeurs inconnues en dernier, ex æquo dans l'ordre d'origine (tri stable). */
export function sortPlayers(players: BoardPlayer[], key: SortKey): BoardPlayer[] {
  return players
    .map((b, i) => ({ b, i, v: sortValue(b, key) }))
    .sort((x, y) => {
      if (x.v === null && y.v === null) return x.i - y.i;
      if (x.v === null) return 1;
      if (y.v === null) return -1;
      return y.v - x.v || x.i - y.i;
    })
    .map((x) => x.b);
}

/** Sélection initiale : MVP officiel, sinon plus forte valeur nette connue, sinon premier joueur. */
export function defaultSelection(teams: BoardTeam[]): string | null {
  const all = teams.flatMap((t) => t.players);
  const mvp = all.find((b) => b.mvp);
  if (mvp) return mvp.key;
  const rich = sortPlayers(all, "net")[0];
  if (rich && rich.player.netWorth !== null) return rich.key;
  return all[0]?.key ?? null;
}

/**
 * Résultat d'une équipe : `result` du back (null si le vainqueur est inconnu). Un back plus ancien (sans `result`)
 * retombe sur `winningSide`, jamais sur `outcome`, qui vaut « loss » quand le vainqueur est inconnu.
 */
export function resultOf(match: MatchDetail, team: MatchTeam): "win" | "loss" | "unknown" {
  if (team.result !== undefined) return team.result ?? "unknown";
  return match.winningSide === null ? "unknown" : match.winningSide === team.side ? "win" : "loss";
}

/** Plus grande valeur connue d'une métrique parmi tous les joueurs : référentiel des barres. */
export function maxKnown(
  all: BoardPlayer[],
  get: (p: MatchPlayer) => number | null,
): number | null {
  const vals = all.map((b) => get(b.player)).filter((v): v is number => v !== null);
  return vals.length ? Math.max(...vals) : null;
}

export interface Purchase {
  itemId: number;
  atSeconds: number | null;
  soldAtSeconds: number | null;
  catalog: CatalogItem | null;
}

/** Chronologie des achats : par heure croissante, heure inconnue en fin de liste (ordre d'origine conservé). */
export function purchaseTimeline(
  purchases: MatchPurchase[] | null | undefined,
  catalog: Map<number, CatalogItem> | null | undefined,
): Purchase[] | null {
  if (!purchases) return null;
  return purchases
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const x = a.p.atSeconds;
      const y = b.p.atSeconds;
      if (x === null && y === null) return a.i - b.i;
      if (x === null) return 1;
      if (y === null) return -1;
      return x - y || a.i - b.i;
    })
    .map(({ p }) => ({
      itemId: p.itemId,
      atSeconds: p.atSeconds,
      soldAtSeconds: p.soldAtSeconds,
      catalog: catalog?.get(p.itemId) ?? null,
    }));
}
