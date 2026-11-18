import { request } from "./client";
import type {
  CreateTrackedPlayerInput,
  TrackedInsightsResponse,
  TrackedPlayer,
  TrackedPlayersResponse,
  UpdateTrackedPlayerInput,
} from "./types";

const base = "/tracked-players";

export const listTrackedPlayers = (signal?: AbortSignal) =>
  request<TrackedPlayersResponse>(base, { auth: true, signal });

export const getTrackedPlayer = (id: string, signal?: AbortSignal) =>
  request<TrackedPlayer>(`${base}/${encodeURIComponent(id)}`, { auth: true, signal });

export const createTrackedPlayer = (input: CreateTrackedPlayerInput) =>
  request<TrackedPlayer>(base, { method: "POST", body: input, auth: true });

export const updateTrackedPlayer = (id: string, input: UpdateTrackedPlayerInput) =>
  request<TrackedPlayer>(`${base}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
    auth: true,
  });

export const deleteTrackedPlayer = (id: string) =>
  request<void>(`${base}/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });

/** Cartes de tous les suivis en une requête (v1.12.0). Remplace 2 requêtes par joueur. */
export const getTrackedInsights = (signal?: AbortSignal) =>
  request<TrackedInsightsResponse>(`${base}/insights`, { auth: true, signal });
