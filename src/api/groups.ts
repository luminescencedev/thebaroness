import { request } from "./client";
import type {
  CompareScope,
  Group,
  GroupCompareResponse,
  GroupInput,
  GroupsResponse,
} from "./types";

const base = "/groups";

/** `include=members` (v1.15.0) : identité des membres de TOUS les groupes en une requête, jamais une par membre. */
export const listGroups = (signal?: AbortSignal) =>
  request<GroupsResponse>(base, { query: { include: "members" }, auth: true, signal });

export const getGroup = (id: string, signal?: AbortSignal) =>
  request<Group>(`${base}/${encodeURIComponent(id)}`, { auth: true, signal });

export const createGroup = (input: GroupInput) =>
  request<Group>(base, { method: "POST", body: input, auth: true });

export const updateGroup = (id: string, input: Partial<GroupInput>) =>
  request<Group>(`${base}/${encodeURIComponent(id)}`, { method: "PATCH", body: input, auth: true });

export const deleteGroup = (id: string) =>
  request<void>(`${base}/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });

const compareQuery = (scope: CompareScope) => ({
  period: scope.period,
  gameMode: scope.gameMode,
  matchMode: scope.matchMode,
  // Parties communes (v1.15.0) : mesurées à +0,1 s pour 8 membres (les historiques, déjà lus pour la comparaison,
  // en sont le coût) : une seule requête, pas de seconde lecture à la demande.
  include: "pairs",
});

export const compareGroup = (id: string, scope: CompareScope, signal?: AbortSignal) =>
  request<GroupCompareResponse>(`${base}/${encodeURIComponent(id)}/compare`, {
    query: compareQuery(scope),
    auth: true,
    signal,
  });

export const refreshGroup = (id: string, scope: CompareScope) =>
  request<GroupCompareResponse>(`${base}/${encodeURIComponent(id)}/refresh`, {
    method: "POST",
    query: compareQuery(scope),
    auth: true,
  });
