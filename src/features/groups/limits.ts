/** Limites du back (`group.model.ts` : 60 caractères, 2 à 20 joueurs). */
export const GROUP_LIMITS = { nameMax: 60, membersMin: 2, membersMax: 20 } as const;

/**
 * Entrée directe acceptée par le back : SteamID64, code ami, `[U:1:n]` ou lien `/profiles/<id>`.
 * Un lien de profil personnalisé (`/id/pseudo`) n'est PAS résolu par le back : il passe par la recherche.
 */
export const looksLikeId = (v: string): boolean =>
  /^\d{5,}$/.test(v) || /steamcommunity\.com\/profiles\/\d+/i.test(v) || /^\[U:1:\d+\]$/i.test(v);
