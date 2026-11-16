import { delay, http, HttpResponse } from "msw";
import type {
  CreateTrackedPlayerInput,
  DataMeta,
  PlayerProfile,
  PlayerSummary,
  TrackedPlayer,
} from "@/api/types";
import { SCENARIOS } from "./scenarios";
import { matchFixtures, mockConfig, playerFixtures, state } from "./state";

const API = "/api";

function apiError(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}
const invalid = (message: string) => apiError(400, "INVALID_INPUT", message);
const notFound = (message = "Ressource introuvable.") => apiError(404, "NOT_FOUND", message);
const unauthorized = () => apiError(401, "UNAUTHORIZED", "Connexion requise ou session expirée.");
const unavailable = () =>
  apiError(503, "SERVICE_UNAVAILABLE", "Les statistiques sont temporairement indisponibles.");

const meta = (isPartial = false): DataMeta => ({
  fetchedAt: new Date().toISOString(),
  sourceUpdatedAt: null,
  isStale: false,
  isPartial,
});

async function latency() {
  if (mockConfig.latencyMs > 0) await delay(mockConfig.latencyMs);
}

function userIdFrom(request: Request): string | null {
  const header = request.headers.get("Authorization");
  const match = header?.match(/^Bearer mock\.([^.]+)\.signature$/);
  const id = match?.[1];
  return id && state.users.some((u) => u.id === id) ? id : null;
}

const STEAM_ID_RE = /^\d{17}$/;
const OBJECT_ID_RE = /^[0-9a-f]{24}$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

/** Valide alias, note et tags (regles 7.2 du cahier des charges). Retourne un message ou null. */
function validateTrackedFields(body: Record<string, unknown>): string | null {
  const { alias, note, tags } = body;
  if (alias !== undefined && (typeof alias !== "string" || alias.trim().length > 80))
    return "alias : 80 caractères maximum.";
  if (note !== undefined && (typeof note !== "string" || note.trim().length > 1000))
    return "note : 1000 caractères maximum.";
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > 10) return "tags : 10 maximum.";
    const cleaned = tags.map((t) => (typeof t === "string" ? t.trim() : ""));
    if (cleaned.some((t) => t.length < 1 || t.length > 24)) return "tags : 1 à 24 caractères.";
    if (new Set(cleaned).size !== cleaned.length) return "tags : doublons interdits.";
  }
  return null;
}

const cleanTags = (tags: unknown): string[] =>
  Array.isArray(tags) ? tags.map((t) => String(t).trim()) : [];

const summaryOf = (p: Omit<PlayerProfile, "meta">): PlayerSummary => ({
  steamId: p.player.steamId,
  accountId: p.player.accountId,
  displayName: p.player.displayName,
  avatarUrl: p.player.avatarUrl,
});

export const handlers = [
  http.get(`${API}/health`, async () => {
    await latency();
    return HttpResponse.json({ status: "ok" });
  }),

  http.get(`${API}/auth/me`, async ({ request }) => {
    await latency();
    const id = userIdFrom(request);
    const user = state.users.find((u) => u.id === id);
    return user ? HttpResponse.json(user) : unauthorized();
  }),

  http.get(`${API}/players/search`, async ({ request }) => {
    await latency();
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
    if (q.length === 0) return invalid("Le paramètre q est obligatoire.");
    const needle = q.toLowerCase();
    if (needle === SCENARIOS.searchUnavailable) return unavailable();
    if (needle === SCENARIOS.searchRateLimited)
      return apiError(429, "RATE_LIMITED", "Trop de requêtes. Réessayez dans un instant.");
    const items =
      needle === SCENARIOS.searchEmpty
        ? []
        : playerFixtures
            .filter(
              (p) => p.player.displayName.toLowerCase().includes(needle) || p.player.steamId === q,
            )
            .map(summaryOf);
    return HttpResponse.json({ items, meta: meta() });
  }),

  http.get(`${API}/players/:steamId/matches`, async ({ request, params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw === null ? 20 : Number(limitRaw);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
      return invalid("limit doit être un entier entre 1 et 50.");
    const cursor = url.searchParams.get("cursor");
    let offset = 0;
    if (cursor !== null) {
      offset = Number(cursor.replace(/^c/, ""));
      if (!/^c\d+$/.test(cursor)) return invalid("Curseur invalide.");
    }

    const all = matchFixtures[steamId] ?? [];
    const items = all.slice(offset, offset + limit);
    const next = offset + limit;
    return HttpResponse.json({
      items,
      nextCursor: next < all.length ? `c${next}` : null,
      meta: meta(fixture.partial === true),
    });
  }),

  http.get(`${API}/players/:steamId`, async ({ params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    const { partial, ...profile } = fixture;
    return HttpResponse.json({ ...profile, meta: meta(partial === true) });
  }),

  http.get(`${API}/tracked-players`, async ({ request }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    return HttpResponse.json({ items: state.tracked.get(owner) ?? [] });
  }),

  http.post(`${API}/tracked-players`, async ({ request }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const body = await readJson(request);
    if (!body) return invalid("Corps JSON invalide.");
    const allowed = new Set(["steamId", "alias", "note", "tags"]);
    if (Object.keys(body).some((k) => !allowed.has(k))) return invalid("Champ non autorisé.");
    if (typeof body.steamId !== "string" || !STEAM_ID_RE.test(body.steamId))
      return invalid("steamId doit contenir 17 chiffres.");
    const fieldError = validateTrackedFields(body);
    if (fieldError) return invalid(fieldError);

    const list = state.tracked.get(owner) ?? [];
    if (list.some((t) => t.steamId === body.steamId))
      return apiError(409, "ALREADY_TRACKED", "Ce joueur est déjà dans vos suivis.");

    const input = body as unknown as CreateTrackedPlayerInput;
    const now = new Date().toISOString();
    const created: TrackedPlayer = {
      id: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      steamId: input.steamId,
      alias: input.alias?.trim() ?? "",
      note: input.note?.trim() ?? "",
      tags: cleanTags(input.tags),
      createdAt: now,
      updatedAt: now,
    };
    state.tracked.set(owner, [created, ...list]);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${API}/tracked-players/:id`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const found = state.tracked.get(owner)?.find((t) => t.id === id);
    return found ? HttpResponse.json(found) : notFound("Suivi introuvable.");
  }),

  http.patch(`${API}/tracked-players/:id`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const body = await readJson(request);
    if (!body || Object.keys(body).length === 0) return invalid("Aucune modification fournie.");
    const allowed = new Set(["alias", "note", "tags"]);
    if (Object.keys(body).some((k) => !allowed.has(k))) return invalid("Champ non autorisé.");
    const fieldError = validateTrackedFields(body);
    if (fieldError) return invalid(fieldError);

    const list = state.tracked.get(owner) ?? [];
    const index = list.findIndex((t) => t.id === id);
    const current = list[index];
    if (!current) return notFound("Suivi introuvable.");
    const updated: TrackedPlayer = {
      ...current,
      ...(typeof body.alias === "string" && { alias: body.alias.trim() }),
      ...(typeof body.note === "string" && { note: body.note.trim() }),
      ...(body.tags !== undefined && { tags: cleanTags(body.tags) }),
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${API}/tracked-players/:id`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const list = state.tracked.get(owner) ?? [];
    if (!list.some((t) => t.id === id)) return notFound("Suivi introuvable.");
    state.tracked.set(
      owner,
      list.filter((t) => t.id !== id),
    );
    return new HttpResponse(null, { status: 204 });
  }),
];
