import { useSyncExternalStore } from "react";
import { sessionStore, type Session } from "@/api/session";

/** Session courante (en mémoire) ou null. */
export function useSession(): Session | null {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.get);
}
