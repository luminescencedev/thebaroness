import { useSyncExternalStore } from "react";

export interface NavSubject {
  steamId: string;
  name: string;
  rankName: string | null;
  rankImage: string | null | undefined;
  color: string | undefined;
}

let subject: NavSubject | null = null;
const listeners = new Set<() => void>();

/** Joueur affiché : la pilule du header peut le rappeler au défilement, la palette propose ses actions. */
export function setNavSubject(next: NavSubject | null): void {
  subject = next;
  listeners.forEach((l) => l());
}

export function useNavSubject(): NavSubject | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => subject,
    () => null,
  );
}

/** Titre de la page courante (publié par useDocumentTitle) : feuille du fil d'Ariane des pages de détail. */
let label: string | null = null;
const labelListeners = new Set<() => void>();

export function setNavLabel(next: string | null): void {
  label = next;
  labelListeners.forEach((l) => l());
}

export function useNavLabel(): string | null {
  return useSyncExternalStore(
    (cb) => {
      labelListeners.add(cb);
      return () => labelListeners.delete(cb);
    },
    () => label,
    () => null,
  );
}
