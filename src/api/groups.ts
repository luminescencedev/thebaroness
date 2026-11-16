import { request } from "./client";
import type {
  ComparePeriod,
  Group,
  GroupCompareResponse,
  GroupInput,
  GroupsResponse,
} from "./types";

const base = "/groups";

export const listGroups = (signal?: AbortSignal) =>
  request<GroupsResponse>(base, { auth: true, signal });

export const getGroup = (id: string, signal?: AbortSignal) =>
  request<Group>(`${base}/${encodeURIComponent(id)}`, { auth: true, signal });

export const createGroup = (input: GroupInput) =>
  request<Group>(base, { method: "POST", body: input, auth: true });

export const updateGroup = (id: string, input: Partial<GroupInput>) =>
  request<Group>(`${base}/${encodeURIComponent(id)}`, { method: "PATCH", body: input, auth: true });

export const deleteGroup = (id: string) =>
  request<void>(`${base}/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });

export const compareGroup = (id: string, period: ComparePeriod, signal?: AbortSignal) =>
  request<GroupCompareResponse>(`${base}/${encodeURIComponent(id)}/compare`, {
    query: { period },
    auth: true,
    signal,
  });
