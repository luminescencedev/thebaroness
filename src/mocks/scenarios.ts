/**
 * Scenarios deterministes du mode mock. Le front utilise ces valeurs pour
 * declencher les etats vide, partiel et erreur sans toucher au code des ecrans.
 */
export const SCENARIOS = {
  /** Recherche : aucun resultat. */
  searchEmpty: "vide",
  /** Recherche : 503 SERVICE_UNAVAILABLE. */
  searchUnavailable: "indispo",
  /** Recherche : 429 RATE_LIMITED. */
  searchRateLimited: "limite",
  /** Profil complet. */
  steamIdFull: "76561198000000000",
  /** Profil partiel (statistiques null, aucune partie). */
  steamIdPartial: "76561198000000001",
  /** Profil : 503 SERVICE_UNAVAILABLE. */
  steamIdUnavailable: "76561198000000503",
} as const;

export const DEMO_ACCOUNT = { email: "alice@example.test", password: "MotDePasse123!" } as const;
