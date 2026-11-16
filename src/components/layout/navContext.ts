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
