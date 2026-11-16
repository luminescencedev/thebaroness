/** Base de l'API du backend. Valeur par défaut : proxy Vite. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Mock actif : `npm run dev:mock` ou VITE_API_MODE=mock, jamais en production. */
export const MOCK_ENABLED: boolean =
  import.meta.env.DEV &&
  (import.meta.env.MODE === "mock" || import.meta.env.VITE_API_MODE === "mock");
