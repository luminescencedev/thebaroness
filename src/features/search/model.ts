import type { PlayerSummary } from "@/api";

/** SteamID64 : 17 chiffres. Seul format d'identifiant que `/players/search` et la palette acceptent en direct. */
export const STEAM_ID_RE = /^\d{17}$/;

/** Longueur minimale d'un terme envoyé au back. */
export const MIN_QUERY = 2;

/** Délai entre la dernière frappe et la mise à jour de l'URL (donc de la requête). */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Normalisation des pseudos pour détecter de vrais homonymes : Unicode compatible (NFKC), espaces rognés et
 * réduits, casse ignorée. Les accents et les chiffres restent significatifs : « ZephyrWolf » et
 * « ZephyrWolf20 » ne sont pas des homonymes.
 */
export const normalizeName = (name: string): string =>
  name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

export interface HomonymGroup {
  /** Pseudo normalisé commun. */
  key: string;
  /** Comptes, dans l'ordre retourné par le back. */
  players: PlayerSummary[];
  /** Le pseudo est exactement celui qui a été cherché. */
  exact: boolean;
}

export interface GroupedResults {
  /** Pseudo identique à la recherche, porté par un seul compte. */
  exact: PlayerSummary[];
  /** Pseudos portés par au moins deux comptes. */
  homonyms: HomonymGroup[];
  /** Tous les autres : pseudos proches, jamais présentés comme homonymes. */
  similar: PlayerSummary[];
}

/** Présentation des résultats du back (ordre conservé). Aucune donnée n'est ajoutée ni déduite. */
export function groupResults(items: readonly PlayerSummary[], query: string): GroupedResults {
  const q = normalizeName(query);
  const byName = new Map<string, PlayerSummary[]>();
  for (const p of items) {
    const key = normalizeName(p.displayName);
    byName.set(key, [...(byName.get(key) ?? []), p]);
  }
  const homonyms: HomonymGroup[] = [...byName.entries()]
    .filter(([, players]) => players.length > 1)
    .map(([key, players]) => ({ key, players, exact: key === q }))
    .sort((a, b) => Number(b.exact) - Number(a.exact));
  const grouped = new Set(homonyms.flatMap((g) => g.players.map((p) => p.steamId)));
  const singles = items.filter((p) => !grouped.has(p.steamId));
  return {
    exact: singles.filter((p) => normalizeName(p.displayName) === q),
    homonyms,
    similar: singles.filter((p) => normalizeName(p.displayName) !== q),
  };
}

/** Pseudos (normalisés) portés par plusieurs résultats : sert à signaler « même pseudo » dans la palette. */
export function homonymKeys(items: readonly PlayerSummary[]): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const p of items) {
    const k = normalizeName(p.displayName);
    (seen.has(k) ? dup : seen).add(k);
  }
  return dup;
}

/** Découpe un pseudo autour de la première occurrence du terme (casse ignorée), pour la mise en valeur. */
export function matchParts(
  name: string,
  query: string,
): { before: string; match: string; after: string } | null {
  const q = query.trim();
  if (!q) return null;
  const lower = name.toLowerCase();
  // Certains caractères changent de longueur en minuscules : mieux vaut ne rien surligner que décaler.
  if (lower.length !== name.length) return null;
  const i = lower.indexOf(q.toLowerCase());
  if (i < 0) return null;
  return {
    before: name.slice(0, i),
    match: name.slice(i, i + q.length),
    after: name.slice(i + q.length),
  };
}
