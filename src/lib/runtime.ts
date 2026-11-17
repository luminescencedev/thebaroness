/** Vrai quand les réponses viennent de MSW (données synthétiques), jamais en production. */
export const IS_MOCK =
  import.meta.env.MODE === "mock" ||
  import.meta.env.MODE === "test" ||
  import.meta.env.VITE_API_MODE === "mock";
