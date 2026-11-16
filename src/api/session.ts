import type { PublicUser } from "./types";

/**
 * Session gardée en mémoire seulement : pas de localStorage ni de cookie.
 * Un rechargement complet de la page demande une reconnexion.
 */
export interface Session {
  token: string;
  user: PublicUser;
}

let current: Session | null = null;
const listeners = new Set<() => void>();

export const sessionStore = {
  get: (): Session | null => current,
  set(session: Session): void {
    current = session;
    listeners.forEach((l) => l());
  },
  clear(): void {
    if (current === null) return;
    current = null;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
