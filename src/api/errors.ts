import type { ApiErrorBody } from "./types";

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "ALREADY_TRACKED"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | (string & {});

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const error = (value as { error: unknown }).error;
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

/** Convertit l'enveloppe { error: { code, message } } en ApiError. */
export function toApiError(status: number, body: unknown): ApiError {
  if (isErrorBody(body)) return new ApiError(status, body.error.code, body.error.message);
  return new ApiError(status, "INTERNAL_ERROR", "Une erreur est survenue. Réessayez plus tard.");
}

export function networkError(): ApiError {
  return new ApiError(0, "NETWORK_ERROR", "Impossible de joindre le serveur.");
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
