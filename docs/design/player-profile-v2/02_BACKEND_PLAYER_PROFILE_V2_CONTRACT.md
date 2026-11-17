# The Baroness — Backend contract proposal: Player Profile V2

**Proposal, NOT yet implemented.** Intended as a review document for LilStick's backend, not a drop-in OpenAPI replacement. Date: 2026-11-17.

## 0. Actual backend baseline (verified on public GitHub)

Repository `LilStick/thebaroness-back`, `main` @ `228064057f899d5949e5a6df89e41c34abc17165`. Source of truth `docs/openapi.yaml` **v1.8.0**, `src/modules/players/players.service.ts`, `players.routes.ts`, `src/modules/meta/meta.service.ts`, `src/integrations/deadlock/deadlock.schemas.ts` and `src/database/api-cache.ts`.

**Already shipped:**
- `GET /api/players/{steamId}` Steam profile, rank derived from latest ranked history badge, career-ish aggregates from available history.
- `GET /api/players/{steamId}/matches?limit=1..50&cursor=...`, cursor pagination over cached normalized history; `MatchSummary` now contains `matchMode` and `gameMode` (v1.7.0), as does `MatchDetail`.
- `GET /api/players/{steamId}/heroes` full observed-history hero aggregation, **no period/mode filters yet**.
- `POST /api/players/{steamId}/refresh` 60-second min refresh cooldown, plus persistent cached history and Steam profile.
- `GET /api/matches/{matchId}`, `GET /api/heroes`, hero stats, ranks, leaderboard, groups and comparison.
- MongoDB `api_cache` supports logical TTL and stale copies; `refresh-worker` prewarms tracked/group members.
- Backend `docs/HANDOFF.md` says **all previously requested routes delivered** and asks front to update to v1.8.0; frontend's `docs/HANDOFF.md` still contains stale requests. This needs reconciliation before P0.

**Observed implementation caveat:**
- `toStoredMatches` excludes outcome codes other than 1 (win) or 2 (loss). Document as observed eligible match set; avoid 'every match ever played' claims.
- `computeStats` currently sums each known K, D, A independently, potentially combining different coverage sets. For P0 aggregates, use one complete-case set for **all** numerator/denominator fields, and include `sampleSize`.
- `matches()` slices cached history and only then maps; filtering must be applied **before** cursor pagination.
- `gameMode` (`normal`, `street_brawl`, etc.) and `matchMode` (`ranked`, `unranked`, etc.) are independent dimensions, not one enum.
- Back already has `catalog.rankedSeasonStart()` and knows season 2 started 2026-11-04 according to its handoff. Read from service/source instead of hardcoding in newly added endpoints.

## 1. Implementation principles

- Additive, backward-compatible contracts: keep v1.8.0 behavior for clients without new query parameters; adjust schema version only when implemented and tested.
- Keep player data public, no JWT for public profile, match-history or item catalogue. Preserve auth requirements for tracked players and private groups.
- Reuse `cached(history:${accountId})` and `profile:${accountId}`. Don't refetch entire source history for every filter widget.
- Expose timestamps, sample sizes, filter scope, eligibility and partial/stale flags. `null` means unknown; `0` means known zero.
- OpenAPI is authoritative: `docs/openapi.yaml` and types must match implementation, mocks, fixtures and tests.
- Minimize query fan-out. Batch where upstream APIs allow, lazily fetch enriched match detail, cache by stable `matchId` and patch version if needed.
- Reuse existing unified `AppError`, route Zod parsing, Mongo cache, rate-limiter and error conventions. Respect `Retry-After` on provider 503/504/429.

## 2. Canonical filter model

Proposed query parameter types, for **new** endpoints and optional extensions:

```ts
export type ProfilePeriod = '7d' | '30d' | 'season';
export type GameModeFilter = 'all' | 'normal' | 'street_brawl';
export type MatchModeFilter = 'all' | 'ranked' | 'unranked';
export type MatchOutcomeFilter = 'all' | 'win' | 'loss';

export interface PlayerStatsFilter {
  period: ProfilePeriod;
  gameMode: GameModeFilter;
  matchMode: MatchModeFilter;
}
```

- Default: `period=30d&gameMode=all&matchMode=all` **on NEW `/overview`**. Other existing routes keep their v1.8.0 defaults until clients migrate.
- `7d`, `30d`: UTC lookback from stable request reference time. `season`: ranked season start from `catalog.rankedSeasonStart()`, with explicit fallback semantics and reason if unknown. Rank currently visible in header is **not filtered**.
- `gameMode=normal` is format 6v6 and may include `ranked` and `unranked` matchmaking. Do not mix these axes or label both 'Normal'.
- Handle historical cached entries with missing modes (`null`); exclude unknown values from a specific mode filter, include them only under `all`, with coverage counts.
- Sort by `startTime desc`, tie `matchId desc` as BigInt-safe comparison. Never coerce SteamID64 or MatchID to unsafe JS Number for identity.
- `200` with empty eligible data is fine (`items=[]`, `summary.matches=0`, nullable ratios), not `404`. `404` only for unknown player/match.
- `400 INVALID_INPUT` for malformed enum, cursor, range/ID, etc.

## 3. P0 — GET `/api/players/{steamId}/overview`

**Objective:** lightweight aggregate response for above-the-fold profile and left widgets; cache computed results per player + filter + effective source version; player identity/rank remain in existing `/players/{steamId}` to avoid duplication.

Suggested 200 payload:

```json
{
  "filters": {"period":"30d", "gameMode":"all", "matchMode":"all"},
  "summary": {
    "matches": 20,
    "wins": 12,
    "losses": 8,
    "winRate": 60.0,
    "kills": 130,
    "deaths": 90,
    "assists": 180,
    "kda": 3.44,
    "kdaSampleSize": 20,
    "avgNetWorthPerMinute": 1084,
    "netWorthPerMinuteSampleSize": 19,
    "avgDurationSeconds": 1860,
    "durationSampleSize": 20,
    "lastMatchAt": "2026-11-16T22:40:00.000Z"
  },
  "modes": [
    {"gameMode":"normal", "matchMode":"ranked", "matches":8, "wins":5, "losses":3, "winRate":62.5},
    {"gameMode":"normal", "matchMode":"unranked", "matches":9, "wins":5, "losses":4, "winRate":55.56},
    {"gameMode":"street_brawl", "matchMode":"unranked", "matches":3, "wins":2, "losses":1, "winRate":66.67}
  ],
  "topHeroes": [
    {"heroId":1, "matches":10, "wins":7, "losses":3, "winRate":70.0, "kda":3.8, "kdaSampleSize":10},
    {"heroId":2, "matches":6, "wins":3, "losses":3, "winRate":50.0, "kda":3.2, "kdaSampleSize":6},
    {"heroId":3, "matches":4, "wins":2, "losses":2, "winRate":50.0, "kda":2.9, "kdaSampleSize":4}
  ],
  "coverage": {
    "requestedFrom": "2026-10-18T00:00:00.000Z",
    "requestedTo": "2026-11-17T00:00:00.000Z",
    "observedFrom": "2026-10-20T12:30:00.000Z",
    "observedTo": "2026-11-16T22:40:00.000Z",
    "includedMatches":20,
    "excludedUnknownMode":0,
    "isPartial":false,
    "notes":[]
  },
  "meta":{"fetchedAt":"2026-11-17T08:30:00.000Z", "sourceUpdatedAt":null, "isStale":false, "isPartial":false}
}
```

**Sample values illustrative only.** Consistency checks: 12+8=20; hero counts=20; modes=20; `round((130+180)/max(90,1),2)=3.44`. No guarantee a finite observed range establishes complete historical coverage; `isPartial` must represent known source limitations, not merely a guess from missing dates.

**Important nuances:**
- `modes` are *observed* combinations, not a single blended label. Only show combinations with nonzero eligible games; unknown modes tracked separately in coverage if needed.
- `topHeroes` can use catalog indexes for name/image, but prefer returning normalized label/image or having front reuse existing catalog; avoid duplicate N+1 remote calls.
- Keep a concise `DataMeta` object following the v1.8.0 conventions.
- On missing stats, use `null` with `sampleSize=0`; e.g. no valid KDA yields null, not 0.
- `avgNetWorthPerMinute` is mean of *valid per-match* ratios, not total net worth / total time. If a weighted alternative is needed, name it separately.
- Source metadata should identify the observed period and whether history is incomplete. Explicitly decide on clip boundaries and day/timezone for seasonal widgets.

## 4. P0 — extend GET `/api/players/{steamId}/matches`

**Current:** `limit` 1..50, `cursor` opaque, no filters. **Proposed additive params:**

`period=7d|30d|season`, `gameMode=...`, `matchMode=...`, `heroId=<positive integer>`, `outcome=win|loss|all`, `limit=1..50`, `cursor`.

**Backward compatibility:** with no new filters, same response and eligibility as v1.8.0; mode fields remain present. Expose `nextCursor` as before. Optional `appliedFilters` and `coverage` can be added without removing existing fields.

**Algorithm requirements:**
1. Read cached history once, apply allowed outcome + period + mode + hero filters to **entire stored dataset**.
2. Sort deterministically, then apply opaque cursor and page limit (never filter only the fetched page).
3. Bind cursor to filter fingerprint/version or validate equivalent to avoid stale/mismatched pagination; invalid old/mismatched cursor responds 400 or deterministic restart per published contract.
4. Avoid duplicates/missing rows for matches sharing same timestamp; preserve match ID string precision.
5. Avoid auto-loading 200 matches just to draw top stats. The `/overview` should serve that need.
6. Enrich only a **single expanded match** or the match detail route. Do not fetch heavy metadata for every list row.
7. Support nullable fields and historic cache records where `matchMode`/`gameMode` were absent.

## 5. P0 — extend GET `/api/players/{steamId}/heroes`

Add optional `period`, `gameMode`, `matchMode`, same semantics. Keep no-filter response equivalent to v1.8.0. Extend each hero record additively with `losses`, `kdaSampleSize`, optional `netWorthPerMinute` and `sampleSize`. Do not expand scope to global hero meta unless requested.

**Backend batching note:** frontend currently makes up to 12 separate `/heroes/{heroId}/stats` requests to obtain global meta comparisons. Consider a separate aggregate endpoint in a future milestone; not a prerequisite for first profile V2.

## 6. P1 — Activity heatmap

`GET /api/players/{steamId}/activity?weeks=12&gameMode=...&matchMode=...`

Return days keyed by **UTC ISO date** with `matches`, `wins`, `losses`, and `coverage` describing source-history completeness. Include all days of the requested 12-week window when coverage can be established; otherwise expose unknown days explicitly (not 0). This widget's 12-week window is intentionally independent of the profile's `period=7d|30d` filter.

If the backend can calculate day buckets from its complete normalized cached history with stable coverage, this is inexpensive; assess before creating a redundant persistent collection.

## 7. P1 — Progression, calibration and trends

- Proposed `GET /api/players/{steamId}/rank-history?period=...`, points from `ranked_display_badge`/`ranked_delta` on ranked games, preserving gaps. Distinguish Valve badge (`tier*10+subrank`) from the existing ordinal `tier*6+subrank`; convert explicitly and test. In Eternus, respect documented percentile behavior. No fake MMR.
- Enrich existing `PlayerRank` **additively** with placement/calibration, latest ranked match, season and point progression only if Deadlock's individual `/v1/players/{account_id}/rank` is consulted and supports them reliably. Backend today derives rank from cached match history, which is useful but not equivalent to every nuance of current individual rank endpoint.
- `GET /api/players/{steamId}/trends` or `?include=trend` in `/overview` after load testing. Compare last N matches vs previous N with equal eligible sample sizes; compute rolling winrate only after full 10 matches.
- `GET /api/players/{steamId}/relationships` after validating Deadlock mate/enemy source semantics; NEVER present repeated teammates as confirmed Steam friends/party.

## 8. P1 — Lazy enriched match detail (for rich dense rows)

Existing `GET /api/matches/{matchId}` returns `MatchDetail` with teams, player identity, K/D/A, net worth, last hits and denies. It does **not currently normalize item purchases, build order, damage breakdown or full match timeline**.

Proposed additive expansion after upstream schema verification:

```ts
interface EnrichedMatchPlayer {
  // existing MatchPlayer fields remain
  itemPurchases?: Array<{ itemId: number; purchasedAtSeconds: number | null }> | null;
  finalItemIds?: number[] | null;
  heroDamage?: number | null;
  objectiveDamage?: number | null;
  soulProgression?: Array<{ t: number; value: number }> | null;
}
```

Only add fields actually present and reliable upstream. If no purchase timestamp is available, use `null`, not inferred seconds. Cache expensive metadata per match ID; do not enrich every historical summary response. The frontend can show a compact strip of real item icons once these fields and the catalog are delivered.

## 9. P2 infrastructure — Items catalogue and statistics (future, NOT blocking profile)

Planned backend API, subject to separate design review:
- `GET /api/items?category=&tier=&q=&patch=` — normalized purchasable items, images, names, shop slot, cost, tier, active/passive category, available data.
- `GET /api/items/{itemId}?patch=` — normalized full item properties, attributes, upgrades and patch metadata.
- `GET /api/items/{itemId}/stats?period=&rankTier=&heroId=` — available and defensible aggregated analytics; return denominators and source date.
- `GET /api/builds?...` and `GET /api/builds/{id}` only after deciding representation, permissions and provenance.

Upstream candidate sources: `/v1/assets/items`, `/v1/assets/items/by-type/upgrade`, `/v1/analytics/item-stats`, build endpoints and match metadata (see current official docs). Avoid assuming every upstream stat/purchase is available on every historic match.

**Cache strategy:**
- Reuse `api_cache` for normalized item catalogue initially. Cache key must incorporate **upstream game/client version** and language (`english` for game names); do not cache only under a constant key if historical patch support exists.
- Keep latest version pointer distinct from immutable per-version snapshots; scheduled or on-demand refresh with safeguards; data-index and image URLs/version pinned.
- Item analytics are **not static**: shorter TTL keyed by full filter set and source version, react to upstream `Retry-After` and a stale-if-error fallback.
- Prefer validated CDN asset URLs and durable fallbacks; do not download entire catalog images on each request.
- Cache-hit/miss metrics, idempotent import, schema validation, stale/partial flags, bounded concurrency. Maintain historical builds with their original patch mapping.

## 10. Unit/integration tests expected from LilStick

- `gameMode` vs `matchMode`: correct independent filters, unknown mode excluded only when specific value selected.
- 7d/30d/season boundaries, UTC, season fallback.
- Filtering before pagination; filtered cursor changes, tie timestamps, invalid cursor, stable sort.
- Full-case KDA numerator/denominator and valid net/min sample counts.
- 0 eligible matches / null values / partial or stale cache.
- 429/503/504, Retry-After, cache fallback; no N+1 upstream fetch from one profile request.
- Refresh worker coexistence, backwards compatibility v1.8 routes, OpenAPI/handler consistency.
- Validate real source sample (not only synthetic fixtures); do not log or expose secrets.

## 11. Communication convention for two agents

**Front:** write requests and explicit mock contract in `thebaroness/docs/HANDOFF.md`; never claim a proposed route is delivered.  
**Back:** confirm accepted schema and return delivered version/commit plus any adjustments in `thebaroness-back/docs/HANDOFF.md`.  
**Both:** import agreed backend `docs/openapi.yaml` into frontend `src/contracts/openapi.yaml` only after actual backend implementation. Read current head and reconcile before overwriting any handoff, since both files already contain extensive history.

## References

- Public backend: https://github.com/LilStick/thebaroness-back
- Public frontend: https://github.com/luminescencedev/thebaroness/tree/refonte-ui
- Deadlock API (official hosted reference): https://api.deadlock-api.com/docs
- `/v1/players/{account_id}/match-history`, `/v1/players/{account_id}/rank`, `/v1/assets/items/by-type/upgrade`, `/v1/analytics/item-stats` via official OpenAPI.
