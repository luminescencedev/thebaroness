import { request } from "./client";
import type { HealthResponse } from "./types";

export const getHealth = (signal?: AbortSignal) => request<HealthResponse>("/health", { signal });
