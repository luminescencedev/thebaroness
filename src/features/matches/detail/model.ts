import type { CatalogItem, MatchDetail, MatchPlayer, MatchPurchase, TeamSide } from "@/api";
import { kdaRatio } from "@/lib/stats";

/**
 * Modèle de présentation de la page partie. Tout est dérivé de `GET /matches/{id}` ; une valeur absente
 * reste null (« n/d »), jamais 0, et rien n'est synthétisé (pas de score d'impact, pas de courbe).
 */
export interface BoardPlayer {
  /** Clé stable : équipe + position d'origine, indépendante du tri et du SteamID (parfois absent). */
  key: string;
  side: TeamSide;
  player: MatchPlayer;
  kda: number | null;
  /** Participation aux éliminations en % : valeur du back, sinon (K + A) / éliminations d'équipe si complètes. */
  kp: number | null;
  mvp: boolean;
  /** Position par souls (valeur nette) parmi tous les joueurs connus de la partie, 1 = plus riche. */
  netRank: number | null;
}

export interface BoardTeam {
  side: TeamSide;
  averageRankName: string | null;
  players: BoardPlayer[];
}

export type SortKey = "net" | "damage" | "kda";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "net", label: "Souls" },
  { value: "damage", label: "Dégâts" },
  { value: "kda", label: "KDA" },
];

export const kdaOf = (p: MatchPlayer): number | null => kdaRatio(p.kills, p.deaths, p.assists);

/** Somme d'une valeur sur une équipe : seulement si tous les joueurs l'ont, sinon incomplète. */
export interface TeamTotal {
  value: number | null;
  known: number;
  of: number;
  complete: boolean;
}

export function teamTotal(
  players: MatchPlayer[],
  get: (p: MatchPlayer) => number | null,
): TeamTotal {
  const vals = players.map(get).filter((v): v is number => v !== null);
  const complete = players.length > 0 && vals.length === players.length;
  return {
    value: complete ? vals.reduce((s, v) => s + v, 0) : null,
    known: vals.length,
    of: players.length,
    complete,
  };
}

const SIDES: TeamSide[] = ["amber", "sapphire"];

/** Équipes dans l'ordre fixe Hidden King puis Archmother, avec joueurs enrichis. */
export function buildBoard(match: MatchDetail): BoardTeam[] {
  const nets = match.teams
    .flatMap((t) => t.players.map((p) => p.netWorth))
    .filter((v): v is number => v !== null)
    .sort((a, b) => b - a);
  return SIDES.flatMap((side) => {
    const team = match.teams.find((t) => t.side === side);
    if (!team) return [];
    const kills = teamTotal(team.players, (p) => p.kills);
    return [
      {
        side,
        averageRankName: team.averageRankName ?? null,
        players: team.players.map((player, i) => ({
          key: `${side}:${i}`,
          side,
          player,
          kda: kdaOf(player),
          kp:
            player.killParticipation ??
            (kills.complete && kills.value && player.kills !== null && player.assists !== null
              ? Math.min(100, ((player.kills + player.assists) / kills.value) * 100)
              : null),
          mvp: player.mvpRank === 1,
          netRank: player.netWorth === null ? null : nets.indexOf(player.netWorth) + 1,
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

/** Vainqueur : uniquement `winningSide`. Les `outcome` d'équipe ne servent jamais à déduire une défaite. */
export const resultOf = (match: MatchDetail, side: TeamSide): "win" | "loss" | "unknown" =>
  match.winningSide === null ? "unknown" : match.winningSide === side ? "win" : "loss";

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
