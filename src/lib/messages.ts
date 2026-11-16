import { isApiError } from "@/api/errors";

/** Message affichable pour une erreur, sans détail technique. */
export function errorMessage(error: unknown): string {
  if (!isApiError(error)) return "Une erreur est survenue.";
  switch (error.code) {
    case "NETWORK_ERROR":
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    case "RATE_LIMITED":
      return "Trop de requêtes. Réessayez dans un instant.";
    case "SERVICE_UNAVAILABLE":
    case "UPSTREAM_ERROR":
      return "Les statistiques sont temporairement indisponibles.";
    case "INTERNAL_ERROR":
      return "Une erreur est survenue. Réessayez plus tard.";
    default:
      return error.message;
  }
}
