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
import {
  allSyntheticPlayers,
  memberStats,
  syntheticMatches,
  heroById,
  heroMetaStats,
  heroes,
  leaderboard,
  matchDetail,
  ranks,
  rankFor,
  syntheticCatalog,
} from "./synthetic";
import type { ComparePeriod, Group, LeaderboardRegion } from "@/api/types";
import mapFixture from "./fixtures/map.json";
import {
  activityOf,
  applied,
  heroStats,
  makeCursor,
  overviewOf,
  parseServerFilters,
  rankHistoryOf,
  readCursor,
  relationshipsOf,
  trendsOf,
  selectMatches,
} from "./profileV2";

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

/** Règles des groupes : nom 1 à 60, 2 à 20 SteamID64 uniques. Retourne un message ou null. */
function validateGroup(body: Record<string, unknown>, full: boolean): string | null {
  const allowed = new Set(["name", "steamIds"]);
  if (Object.keys(body).some((k) => !allowed.has(k))) return "Champ non autorisé.";
  if (full && (body.name === undefined || body.steamIds === undefined))
    return "name et steamIds sont obligatoires.";
  if (body.name !== undefined) {
    if (
      typeof body.name !== "string" ||
      body.name.trim().length < 1 ||
      body.name.trim().length > 60
    )
      return "name : 1 à 60 caractères.";
  }
  if (body.steamIds !== undefined) {
    const ids = body.steamIds;
    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 20)
      return "steamIds : 2 à 20 joueurs.";
    const normalized = ids.map(normalizeSteamInput);
    if (normalized.some((i) => i === null))
      return "steamIds : identifiant invalide (SteamID64, code ami ou lien de profil Steam).";
    if (new Set(normalized).size !== normalized.length) return "steamIds : doublons interdits.";
    body.steamIds = normalized;
  }
  return null;
}

/** Normalise une saisie (SteamID64, code ami, [U:1:n], lien de profil) en SteamID64, comme le back. */
function normalizeSteamInput(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  const url = /steamcommunity\.com\/profiles\/(\d{17})/i.exec(v);
  if (url?.[1]) return url[1];
  const u = /^\[U:1:(\d{1,10})\]$/i.exec(v);
  const digits = u?.[1] ?? (/^\d{1,10}$/.test(v) ? v : null);
  if (digits) return String(BigInt(digits) + 76561197960265728n);
  return /^\d{17}$/.test(v) ? v : null;
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

  http.get(`${API}/heroes/:heroId/stats`, async ({ params }) => {
    await latency();
    const id = Number(params.heroId);
    if (!Number.isInteger(id) || id < 1) return invalid("Identifiant de héros invalide.");
    if (!heroById(id)) return notFound("Héros introuvable.");
    return HttpResponse.json({ stats: heroMetaStats(id), meta: meta() });
  }),

  http.get(`${API}/heroes/:heroId`, async ({ params }) => {
    await latency();
    const id = Number(params.heroId);
    if (!Number.isInteger(id) || id < 1) return invalid("Identifiant de héros invalide.");
    const hero = heroById(id);
    return hero ? HttpResponse.json({ hero, meta: meta() }) : notFound("Héros introuvable.");
  }),

  http.get(`${API}/heroes`, async () => {
    await latency();
    const items = heroes.map(({ lore: _l, stats: _s, abilities: _a, ...summary }) => {
      void [_l, _s, _a];
      return summary;
    });
    return HttpResponse.json({ items, meta: meta() });
  }),

  http.get(`${API}/map`, async () => {
    await latency();
    return HttpResponse.json(mapFixture);
  }),

  http.get(`${API}/ranks`, async () => {
    await latency();
    return HttpResponse.json({ items: ranks });
  }),

  http.get(`${API}/leaderboard`, async ({ request }) => {
    await latency();
    const region = new URL(request.url).searchParams.get("region") ?? "Europe";
    const allowed = ["Europe", "Asia", "NAmerica", "SAmerica", "Oceania"];
    if (!allowed.includes(region)) return invalid("Région invalide.");
    return HttpResponse.json({
      region,
      items: leaderboard(region as LeaderboardRegion),
      meta: meta(),
    });
  }),

  http.get(`${API}/matches/:matchId`, async ({ params }) => {
    await latency();
    const matchId = String(params.matchId);
    if (!/^\d+$/.test(matchId)) return invalid("Identifiant de partie invalide.");
    const owner = allSyntheticPlayers.find((p) =>
      (syntheticMatches[p.steamId] ?? []).some((m) => m.matchId === matchId),
    );
    const summary =
      owner && (syntheticMatches[owner.steamId] ?? []).find((m) => m.matchId === matchId);
    return summary && owner
      ? HttpResponse.json({ match: matchDetail(summary, owner), meta: meta() })
      : notFound("Partie introuvable.");
  }),

  http.post(`${API}/players/:steamId/refresh`, async ({ params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    const { partial, ...profile } = fixture;
    return HttpResponse.json({ ...profile, meta: meta(partial === true) });
  }),

  http.post(`${API}/groups/:id/refresh`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const group = state.groups.get(owner)?.find((g) => g.id === id);
    if (!group) return notFound("Groupe introuvable.");
    const period = (new URL(request.url).searchParams.get("period") ?? "30d") as ComparePeriod;
    if (!["7d", "30d", "season"].includes(period)) return invalid("Période invalide.");
    const members = group.steamIds.flatMap((steamId) => {
      const p = allSyntheticPlayers.find((x) => x.steamId === steamId);
      return p ? [memberStats(p, syntheticMatches[steamId] ?? [], period)] : [];
    });
    if (members.length === 0) return unavailable();
    return HttpResponse.json({ group, period, members, meta: meta() });
  }),

  http.get(`${API}/items`, async ({ request }) => {
    await latency();
    const type = new URL(request.url).searchParams.get("type");
    if (type && !["upgrade", "ability", "weapon"].includes(type)) return invalid("type invalide.");
    return HttpResponse.json({
      clientVersion: 6861,
      items: type && type !== "upgrade" ? [] : syntheticCatalog,
      meta: meta(),
    });
  }),

  http.get(`${API}/players/:steamId/activity`, async ({ request, params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    const q = new URL(request.url).searchParams;
    const weeks = q.get("weeks") === null ? 12 : Number(q.get("weeks"));
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) return invalid("weeks : 1 à 52.");
    const gm = q.get("gameMode") ?? "all";
    const mm = q.get("matchMode") ?? "all";
    if (!["all", "normal", "street_brawl"].includes(gm)) return invalid("gameMode invalide.");
    if (!["all", "ranked", "unranked"].includes(mm)) return invalid("matchMode invalide.");
    return HttpResponse.json({
      ...activityOf(matchFixtures[steamId] ?? [], weeks, gm as "all", mm as "all"),
      meta: meta(fixture.partial === true),
    });
  }),

  http.get(`${API}/players/:steamId/trends`, async ({ request, params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    const q = new URL(request.url).searchParams;
    const size = q.get("size") === null ? 20 : Number(q.get("size"));
    if (!Number.isInteger(size) || size < 5 || size > 50) return invalid("size : 5 à 50.");
    const gm = q.get("gameMode") ?? "all";
    const mm = q.get("matchMode") ?? "all";
    if (!["all", "normal", "street_brawl"].includes(gm)) return invalid("gameMode invalide.");
    if (!["all", "ranked", "unranked"].includes(mm)) return invalid("matchMode invalide.");
    return HttpResponse.json({
      ...trendsOf(matchFixtures[steamId] ?? [], size, gm as "all", mm as "all"),
      meta: meta(fixture.partial === true),
    });
  }),

  http.get(`${API}/players/:steamId/rank-history`, async ({ request, params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    const period = new URL(request.url).searchParams.get("period") ?? "season";
    if (!["7d", "30d", "season"].includes(period)) return invalid("period invalide.");
    const rank = fixture.rank;
    const current =
      typeof rank.tier === "number" && typeof rank.subrank === "number"
        ? { tier: rank.tier, subrank: rank.subrank }
        : null;
    const data = current
      ? rankHistoryOf(matchFixtures[steamId] ?? [], period as "7d", current, (t, s) => {
          const r = rankFor(t, s);
          return { name: r.name ?? `Rang ${t}`, imageUrl: r.imageUrl ?? null };
        })
      : null;
    return HttpResponse.json({
      ...(data ?? {
        period,
        points: [],
        coverage: {
          requestedFrom: null,
          requestedTo: new Date().toISOString(),
          rankedMatches: 0,
          pointCount: 0,
          missingBadge: 0,
          isPartial: false,
          notes: [],
        },
      }),
      meta: meta(fixture.partial === true),
    });
  }),

  http.get(`${API}/players/:steamId/relationships`, async ({ request, params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    const q = new URL(request.url).searchParams;
    const gameMode = q.get("gameMode") ?? "normal";
    if (!["normal", "street_brawl"].includes(gameMode))
      return invalid("gameMode : normal ou street_brawl.");
    const period = q.get("period");
    if (period !== null && !["7d", "30d", "season"].includes(period))
      return invalid("period invalide.");
    const limit = q.get("limit") === null ? 10 : Number(q.get("limit"));
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) return invalid("limit : 1 à 50.");
    const pool = allSyntheticPlayers.filter((p) => p.steamId !== steamId);
    const { teammates, opponents } = relationshipsOf(pool, limit, Number(steamId.slice(-2)));
    return HttpResponse.json({
      appliedFilters: { period, gameMode, sameParty: false, minMatches: 2, limit },
      teammates,
      opponents,
      coverage: { requestedFrom: null, notes: [] },
      meta: meta(fixture.partial === true),
    });
  }),

  http.get(`${API}/players/:steamId/overview`, async ({ request, params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    const parsed = parseServerFilters(new URL(request.url).searchParams, { period: "30d" });
    if ("error" in parsed) return invalid(parsed.error);
    const { period, gameMode, matchMode } = parsed.filters;
    const partial = fixture.partial === true;
    return HttpResponse.json({
      filters: { period: period ?? "30d", gameMode, matchMode },
      ...overviewOf(matchFixtures[steamId] ?? [], parsed.filters),
      meta: meta(partial),
    });
  }),

  http.get(`${API}/players/:steamId/heroes`, async ({ request, params }) => {
    await latency();
    const steamId = String(params.steamId);
    if (!STEAM_ID_RE.test(steamId)) return invalid("Identifiant Steam invalide.");
    if (steamId === SCENARIOS.steamIdUnavailable) return unavailable();
    const fixture = playerFixtures.find((p) => p.player.steamId === steamId);
    if (!fixture) return notFound("Joueur introuvable.");
    // Sans filtre : tout l'historique (comportement v1.8) ; avec filtres : période et modes.
    const parsed = parseServerFilters(new URL(request.url).searchParams, { period: null });
    if ("error" in parsed) return invalid(parsed.error);
    const f = { ...parsed.filters, heroId: null, outcome: "all" as const };
    return HttpResponse.json({
      items: heroStats(selectMatches(matchFixtures[steamId] ?? [], f)),
      appliedFilters: applied(f),
      meta: meta(fixture.partial === true),
    });
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
    const parsed = parseServerFilters(url.searchParams, { period: null });
    if ("error" in parsed) return invalid(parsed.error);
    const f = parsed.filters;
    const cursor = url.searchParams.get("cursor");
    let offset = 0;
    if (cursor !== null) {
      const c = readCursor(cursor, f);
      if ("error" in c) return invalid(c.error);
      offset = c.offset;
    }

    const all = selectMatches(matchFixtures[steamId] ?? [], f);
    const items = all.slice(offset, offset + limit);
    const next = offset + limit;
    return HttpResponse.json({
      items,
      nextCursor: next < all.length ? makeCursor(next, f) : null,
      appliedFilters: applied(f),
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

  http.get(`${API}/groups`, async ({ request }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    // Du plus récemment modifié au plus ancien, comme le back.
    const items = [...(state.groups.get(owner) ?? [])].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    return HttpResponse.json({ items });
  }),

  http.post(`${API}/groups`, async ({ request }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const body = await readJson(request);
    const error = body ? validateGroup(body, true) : "Corps JSON invalide.";
    if (!body || error) return invalid(error ?? "Corps JSON invalide.");
    const now = new Date().toISOString();
    const created: Group = {
      id: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      name: String(body.name).trim(),
      steamIds: body.steamIds as string[],
      createdAt: now,
      updatedAt: now,
    };
    state.groups.set(owner, [created, ...(state.groups.get(owner) ?? [])]);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(`${API}/groups/:id/compare`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const group = state.groups.get(owner)?.find((g) => g.id === id);
    if (!group) return notFound("Groupe introuvable.");
    const period = (new URL(request.url).searchParams.get("period") ?? "30d") as ComparePeriod;
    if (!["7d", "30d", "season"].includes(period)) return invalid("Période invalide.");
    const members = group.steamIds.flatMap((steamId) => {
      const p = allSyntheticPlayers.find((x) => x.steamId === steamId);
      return p ? [memberStats(p, syntheticMatches[steamId] ?? [], period)] : [];
    });
    return HttpResponse.json({
      group,
      period,
      members,
      meta: meta(members.length < group.steamIds.length),
    });
  }),

  http.get(`${API}/groups/:id`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const found = state.groups.get(owner)?.find((g) => g.id === id);
    return found ? HttpResponse.json(found) : notFound("Groupe introuvable.");
  }),

  http.patch(`${API}/groups/:id`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const body = await readJson(request);
    if (!body || Object.keys(body).length === 0) return invalid("Aucune modification fournie.");
    const error = validateGroup(body, false);
    if (error) return invalid(error);
    const list = state.groups.get(owner) ?? [];
    const index = list.findIndex((g) => g.id === id);
    const current = list[index];
    if (!current) return notFound("Groupe introuvable.");
    const updated: Group = {
      ...current,
      ...(typeof body.name === "string" && { name: body.name.trim() }),
      ...(Array.isArray(body.steamIds) && { steamIds: body.steamIds as string[] }),
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${API}/groups/:id`, async ({ request, params }) => {
    await latency();
    const owner = userIdFrom(request);
    if (!owner) return unauthorized();
    const id = String(params.id);
    if (!OBJECT_ID_RE.test(id)) return invalid("Identifiant invalide.");
    const list = state.groups.get(owner) ?? [];
    if (!list.some((g) => g.id === id)) return notFound("Groupe introuvable.");
    state.groups.set(
      owner,
      list.filter((g) => g.id !== id),
    );
    return new HttpResponse(null, { status: 204 });
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
