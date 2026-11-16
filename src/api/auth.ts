import { request } from "./client";
import { sessionStore } from "./session";
import type { AuthResponse, Credentials } from "./types";

async function authenticate(path: string, credentials: Credentials): Promise<AuthResponse> {
  const result = await request<AuthResponse>(path, { method: "POST", body: credentials });
  sessionStore.set({ token: result.token, user: result.user });
  return result;
}

export const register = (credentials: Credentials) => authenticate("/auth/register", credentials);
export const login = (credentials: Credentials) => authenticate("/auth/login", credentials);
export const logout = () => sessionStore.clear();
