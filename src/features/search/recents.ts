import { useSyncExternalStore } from "react";

export interface RecentPlayer {
  steamId: string;
  displayName: string;
  avatarUrl: string | null;
}

const KEY = "baroness:recent-players";
const MAX = 5;
const listeners = new Set<() => void>();
let cache: RecentPlayer[] | null = null;

function read(): RecentPlayer[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter(
          (p): p is RecentPlayer =>
            typeof p?.steamId === "string" &&
            /^\d{17}$/.test(p.steamId) &&
            typeof p?.displayName === "string",
        )
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

/**
 * Derniers profils consultés. Données publiques seulement (SteamID, pseudo, avatar),
 * gardées dans le navigateur : jamais le jeton, jamais envoyées au serveur.
 */
export function rememberPlayer(player: RecentPlayer): void {
  const next = [player, ...read().filter((p) => p.steamId !== player.steamId)].slice(0, MAX);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible : la liste reste en mémoire */
  }
  listeners.forEach((l) => l());
}

export function clearRecents(): void {
  cache = [];
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignoré */
  }
  listeners.forEach((l) => l());
}

export function useRecentPlayers(): RecentPlayer[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    read,
  );
}
