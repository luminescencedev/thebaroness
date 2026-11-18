import type {
  CatalogItem,
  MatchDetail,
  MatchItem,
  MatchPlayer,
  MatchPlayerStats,
  MatchSummary,
  MatchTeam,
} from "@/api/types";

/**
 * Modèle de présentation d'une partie enrichie. Tout est dérivé de MatchDetail (réel) ; une valeur que le
 * back ne livre pas reste null et s'affiche « n/d », jamais 0 et jamais inventée.
 */
export interface Participant extends MatchPlayer {
  isSelf: boolean;
  kda: number | null;
  /** 1 = meilleure valeur nette de la partie. */
  netRank: number | null;
}

export interface ParticipantTeam extends Omit<MatchTeam, "players"> {
  players: Participant[];
  isSelfTeam: boolean;
}

export interface MatchBadge {
  id: string;
  label: string;
  /** Explication du calcul, affichée en infobulle. */
  explain: string;
}

export interface MatchEnrichment {
  teams: ParticipantTeam[];
  self: Participant | null;
  /** Derniers coups : null si le back ne les donne pas. */
  cs: number | null;
  csPerMin: number | null;
  /** Participation aux éliminations, en pourcentage : (K + A) / éliminations de l'équipe. */
  kp: number | null;
  /** Tirs critiques sur héros (tête), en pourcentage : `stats.heroCritRate` du back. */
  hsPct: number | null;
  /** Classement MVP calculé par Valve (1 = meilleur), null si absent. */
  mvpRank: number | null;
  /** Relevé de fin de partie du joueur, null si absent. */
  stats: MatchPlayerStats | null;
  /**
   * Objets finaux (jamais revendus), dans l'ordre du premier achat. null si le back ne livre pas les
   * objets ou si le catalogue n'est pas disponible : l'interface affiche « n/d », jamais un faux build.
   */
  items: MatchItem[] | null;
  /** Position par valeur nette parmi tous les joueurs de la partie. */
  netPosition: { rank: number; of: number } | null;
  badges: MatchBadge[];
}

const kdaOf = (p: MatchPlayer): number | null =>
  p.kills === null || p.deaths === null || p.assists === null
    ? null
    : (p.kills + p.assists) / Math.max(p.deaths, 1);

/** Retrouve le joueur du profil : par SteamID quand le back le donne, sinon par héros et triplet K/D/A. */
function isOwner(p: MatchPlayer, s: MatchSummary, ownerSteamId: string | undefined): boolean {
  if (ownerSteamId && p.steamId) return p.steamId === ownerSteamId;
  return (
    p.heroId === s.heroId && p.kills === s.kills && p.deaths === s.deaths && p.assists === s.assists
  );
}

/** Résout les objets finaux avec le catalogue `GET /items`. Un identifiant absent du catalogue est ignoré. */
function resolveItems(
  self: MatchPlayer | null,
  catalog: Map<number, CatalogItem> | null | undefined,
): MatchItem[] | null {
  const ids = self?.finalItemIds;
  if (!ids || !catalog) return null;
  const first = new Map<number, number>();
  for (const p of self?.purchases ?? [])
    if (!first.has(p.itemId)) first.set(p.itemId, p.atSeconds ?? Number.MAX_SAFE_INTEGER);
  return ids
    .map((id, i) => ({ id, at: first.get(id) ?? Number.MAX_SAFE_INTEGER, i }))
    .sort((a, b) => a.at - b.at || a.i - b.i)
    .flatMap(({ id }) => {
      const c = catalog.get(id);
      if (!c || !c.slot) return [];
      return [
        {
          itemId: id,
          name: c.name ?? `Objet n°${id}`,
          tier: c.tier ?? 1,
          category: c.slot,
          iconUrl: c.imageUrl,
        },
      ];
    });
}

export function enrichMatch(
  summary: MatchSummary,
  detail: MatchDetail,
  ownerSteamId?: string,
  catalog?: Map<number, CatalogItem> | null,
): MatchEnrichment {
  const all = detail.teams.flatMap((t) => t.players);
  const complete = all.length > 0 && all.every((p) => p.netWorth !== null);
  const order = complete ? [...all].sort((a, b) => (b.netWorth ?? 0) - (a.netWorth ?? 0)) : [];
  const netRankOf = (p: MatchPlayer) => (complete ? order.indexOf(p) + 1 : null);

  const teams: ParticipantTeam[] = detail.teams.map((t) => ({
    ...t,
    isSelfTeam: false,
    players: t.players.map((p) => ({
      ...p,
      isSelf: isOwner(p, summary, ownerSteamId),
      kda: kdaOf(p),
      netRank: netRankOf(p),
    })),
  }));
  for (const t of teams) t.isSelfTeam = t.players.some((p) => p.isSelf);
  const selfTeam = teams.find((t) => t.isSelfTeam);
  const self = selfTeam?.players.find((p) => p.isSelf) ?? null;

  const teamKills =
    selfTeam && selfTeam.players.every((p) => p.kills !== null)
      ? selfTeam.players.reduce((a, p) => a + (p.kills ?? 0), 0)
      : null;
  const computedKp =
    self && self.kills !== null && self.assists !== null && teamKills
      ? Math.min(100, ((self.kills + self.assists) / teamKills) * 100)
      : null;
  // Valeur du back quand elle existe (même formule), sinon calcul sur le détail.
  const kp = self?.killParticipation ?? computedKp;

  const minutes = (detail.durationSeconds ?? summary.durationSeconds ?? 0) / 60;
  const cs = self?.lastHits ?? null;

  const badges: MatchBadge[] = [];
  if (self && complete && self.netRank === 1)
    badges.push({
      id: "net-1",
      label: "1er en valeur nette",
      explain: "Meilleure valeur nette parmi les 12 joueurs de la partie.",
    });
  const kdas = all.map(kdaOf);
  if (
    self?.kda != null &&
    kdas.every((k) => k !== null) &&
    self.kda === Math.max(...(kdas as number[]))
  )
    badges.push({
      id: "kda-1",
      label: "Meilleur KDA",
      explain: "KDA le plus élevé parmi les 12 joueurs, (K + A) / max(D, 1).",
    });

  if (self?.mvpRank === 1)
    badges.push({
      id: "mvp",
      label: "MVP",
      explain: "Classement MVP calculé par Valve : 1er de la partie.",
    });

  return {
    teams,
    self,
    cs,
    csPerMin: cs !== null && minutes > 0 ? cs / minutes : null,
    kp,
    hsPct: self?.stats?.heroCritRate ?? null,
    mvpRank: self?.mvpRank ?? null,
    stats: self?.stats ?? null,
    items: resolveItems(self, catalog),
    netPosition: self && self.netRank ? { rank: self.netRank, of: all.length } : null,
    badges,
  };
}
