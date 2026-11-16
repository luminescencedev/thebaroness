import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { notifySessionExpired } from "@/features/auth/sessionExpired";
import { isApiError } from "@/api/errors";

/** Un 401 vide déjà la session (client API) : on prévient l'utilisateur. */
function onUnauthorized(error: unknown) {
  if (isApiError(error) && error.status === 401 && error.code === "UNAUTHORIZED") {
    notifySessionExpired();
  }
}

export function createQueryClient({ retry = true }: { retry?: boolean } = {}): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: onUnauthorized }),
    mutationCache: new MutationCache({
      onError: (error, _v, _c, mutation) => {
        // Les formulaires de connexion affichent leur propre erreur.
        if (mutation.options.mutationKey?.[0] !== "auth") onUnauthorized(error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Pas de nouvelle tentative sur une erreur client (4xx) : elle serait identique.
        retry: (count, error) =>
          retry && !(isApiError(error) && error.status < 500 && error.status !== 0) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}
