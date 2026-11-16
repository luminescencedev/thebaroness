import { API_BASE_URL } from "@/config";
import { ApiError, networkError, toApiError } from "./errors";
import { sessionStore } from "./session";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Route privée : ajoute Authorization: Bearer. */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = new URL(`${base}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Appel HTTP typé vers le backend. Lève ApiError pour toute réponse en erreur. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = false, signal } = options;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (auth) {
    const session = sessionStore.get();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Connexion requise.");
    headers.Authorization = `Bearer ${session.token}`;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw networkError();
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // Un 401 invalide la session : jeton expiré ou falsifié.
    if (response.status === 401 && auth) sessionStore.clear();
    throw toApiError(response.status, payload);
  }
  return payload as T;
}
