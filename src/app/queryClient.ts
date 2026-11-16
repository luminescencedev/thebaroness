import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/api/errors";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Pas de nouvelle tentative sur une erreur client (4xx) : elle serait identique.
        retry: (count, error) =>
          !(isApiError(error) && error.status < 500 && error.status !== 0) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}
