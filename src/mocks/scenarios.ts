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
  /** Groupes : membre dont la lecture est refusée par le quota de la source (429). */
  steamIdRateLimited: "76561198000000429",
} as const;

/** Compte Steam fictif du mode mock : même joueur que Corvid. */
export const DEMO_TOKEN = "mock.507f1f77bcf86cd799439011.signature";
