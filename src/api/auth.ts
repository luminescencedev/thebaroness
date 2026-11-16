import { API_BASE_URL, MOCK_ENABLED } from "@/config";
import { request } from "./client";
import { sessionStore } from "./session";
import type { PublicUser } from "./types";

/**
 * Connexion Steam uniquement (OpenID), gérée par le backend :
 * 1. le front envoie le navigateur vers GET /api/auth/steam (redirection vers Steam) ;
 * 2. le back vérifie la réponse de Steam puis redirige vers /auth/callback#token=<JWT>
 *    (en cas d'échec : /auth/callback?error=<code>) ;
 * 3. le front lit le jeton dans le fragment, appelle GET /api/auth/me et ouvre la session.
 * Le fragment n'est jamais envoyé au serveur. Le jeton reste en mémoire.
 */
export function steamLoginUrl(): string {
  if (MOCK_ENABLED) return "/auth/callback#token=mock.507f1f77bcf86cd799439011.signature";
  return `${API_BASE_URL.replace(/\/$/, "")}/auth/steam`;
}

export const getMe = (token: string) => request<PublicUser>("/auth/me", { token });

/** Ouvre la session à partir du jeton reçu au retour de Steam. */
export async function completeSteamLogin(token: string): Promise<PublicUser> {
  const user = await getMe(token);
  sessionStore.set({ token, user });
  return user;
}

export const logout = () => sessionStore.clear();
