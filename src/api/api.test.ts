import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  ApiError,
  getHealth,
  getPlayer,
  getPlayerMatches,
  listTrackedPlayers,
  login,
  searchPlayers,
  sessionStore,
} from "@/api";
import { DEMO_ACCOUNT, SCENARIOS } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

describe("client API", () => {
  it("retourne le corps typé d'une réponse 200", async () => {
    await expect(getHealth()).resolves.toEqual({ status: "ok" });
  });

  it("garde le steamId en chaîne", async () => {
    const profile = await getPlayer(SCENARIOS.steamIdFull);
    expect(profile.player.steamId).toBe("76561198000000000");
    expect(typeof profile.player.steamId).toBe("string");
    expect(profile.stats).toMatchObject({ matchesPlayed: 42, wins: 24, losses: 18 });
  });

  it("convertit l'enveloppe d'erreur en ApiError", async () => {
    const error = await getPlayer("76561198999999999").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("couvre 400 et 503", async () => {
    await expect(searchPlayers("   ")).rejects.toMatchObject({
      status: 400,
      code: "INVALID_INPUT",
    });
    await expect(searchPlayers(SCENARIOS.searchUnavailable)).rejects.toMatchObject({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("pagine l'historique avec un curseur opaque", async () => {
    const first = await getPlayerMatches(SCENARIOS.steamIdFull, { limit: 30 });
    expect(first.items).toHaveLength(30);
    expect(first.nextCursor).not.toBeNull();
    const second = await getPlayerMatches(SCENARIOS.steamIdFull, {
      limit: 30,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.items).toHaveLength(12);
    expect(second.nextCursor).toBeNull();
  });

  it("refuse un identifiant mal formé en 400", async () => {
    await expect(getPlayer("abc")).rejects.toMatchObject({ status: 400 });
  });

  it("ne contacte pas le réseau sans session sur une route privée", async () => {
    await expect(listTrackedPlayers()).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("envoie le Bearer sur une route privée après connexion", async () => {
    let header: string | null = null;
    server.use(
      http.get("/api/tracked-players", ({ request }) => {
        header = request.headers.get("Authorization");
        return HttpResponse.json({ items: [] });
      }),
    );
    const { token } = await login(DEMO_ACCOUNT);
    await listTrackedPlayers();
    expect(header).toBe(`Bearer ${token}`);
  });

  it("vide la session sur un 401", async () => {
    await login(DEMO_ACCOUNT);
    expect(sessionStore.get()).not.toBeNull();
    server.use(
      http.get("/api/tracked-players", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Expirée." } },
          { status: 401 },
        ),
      ),
    );
    await expect(listTrackedPlayers()).rejects.toMatchObject({ status: 401 });
    expect(sessionStore.get()).toBeNull();
  });

  it("signale une erreur réseau", async () => {
    server.use(http.get("/api/health", () => HttpResponse.error()));
    await expect(getHealth()).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
});
