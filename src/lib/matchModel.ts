import type { MatchDetail, MatchItem, MatchPlayer, MatchSummary, MatchTeam } from "@/api/types";

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
  /** Tirs à la tête, en pourcentage. Pas encore livré par le back : null en production. */
  hsPct: number | null;
  /** Build du joueur ; null tant que le back ne livre pas `items`. */
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

export function enrichMatch(
  summary: MatchSummary,
  detail: MatchDetail,
  ownerSteamId?: string,
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
  const kp =
    self && self.kills !== null && self.assists !== null && teamKills
      ? Math.min(100, ((self.kills + self.assists) / teamKills) * 100)
      : null;

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

  return {
    teams,
    self,
    cs,
    csPerMin: cs !== null && minutes > 0 ? cs / minutes : null,
    kp,
    hsPct: self?.headshotPct ?? null,
    items: self?.items ?? null,
    netPosition: self && self.netRank ? { rank: self.netRank, of: all.length } : null,
    badges,
  };
}
