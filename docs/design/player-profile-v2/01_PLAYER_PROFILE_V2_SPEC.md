# The Baroness — Player Profile V2
## UX, data, interaction and visual implementation specification

**Date:** 2026-11-17  
**Frontend:** `luminescencedev/thebaroness`, branch `refonte-ui`, inspected SHA `84de6a49cf3ec2e607fc892a35145272520516cd`  
**Backend:** `LilStick/thebaroness-back`, branch `main`, inspected SHA `228064057f899d5949e5a6df89e41c34abc17165`  
**Status:** UX direction agreed; implementation requirements proposed, not merged.

## 1. Product objective and confirmed decisions

Build a first-class public Deadlock player profile: understandable in 5 seconds, information-dense enough for returning competitive players, visually screenshot-worthy, and technically trustworthy. Standard tracker functionality takes priority over guilds/social features.

Preserve the existing **landing V3** and **app shell**: graphite base, sidebar belonging to the background, floating rounded content panel, Geist typography, elegant soft shadows, meaningful double bezel on first-level panels. Do not recreate these systems. The player-page **internal composition may be rebuilt from scratch**, while preserving useful hooks, service contracts, auth, and interactions.

**Confirmed desktop information architecture:**
1. Enriched *horizontal competitive identity header*: Steam avatar; Steam name and official rank visually grouped tightly together; rank badge and tier/subrank; placement/calibration only when genuinely known; season context; three hero portraits with contextual stats; actions Follow, Share, Refresh and Steam profile.
2. Tabs: `Aperçu`, `Parties`, `Héros` now; `Performance`, `Rang`, `Coéquipiers` later only when backed by real data.
3. Overview uses **left compact analytical rail ~310–340px**, **right wide flexible column**.
4. Left rail: Rank & Modes; Recent Activity; Top Heroes; optional Period Delta; optional Played With/Against.
5. Right: Recent Performance KPI + compact interactive chart, then dense recent match list.
6. **Recent match rows should be compact:** desktop 64–72px; mobile 76–88px when feasible, and expansion grows as needed. Rich information must not compromise readability.
7. Not a generic SaaS dashboard. Avoid nesting double bezel inside double bezel; never force cards around each match row.

**Prototype reference:** `the-baroness-player-profile-v2.1.html` in the companion files. It is a functional UX reference with fictional data, not production React code or a visual pixel-perfect standard.

## 2. Existing frontend (confirmed)

- Route: `/players/:steamId` in `src/app/router.tsx`, `PlayerPage.tsx` with tabs `overview`, `matches`, `heroes`.
- `ProfileBanner.tsx`: steam avatar, rank, follow, copy SteamID/link and manual refresh (60s cooldown).
- `OverviewTab.tsx`: ~490 lines; currently crowded with many analytics (five KPIs, area chart, roles, heroes, heatmap, hours, KDA histogram, winrate by duration, matches).
- `MatchesTab.tsx`: filters only the loaded matches, not the full backend history; 303 lines.
- `HeroesTab.tsx`: cards based on `PlayerHeroStat`.
- `useProfileData.ts`: relies on `usePlayerHistory()` and separate hero/meta calls (up to 12 requests for hero meta).
- `usePlayerHistory()` auto-fetches pages of 50 up to a client-side cap of 200; only the currently loaded subset is guaranteed in memory.
- Existing frontend `src/contracts/openapi.yaml` is behind the backend schema; align to backend **v1.8.0** first (see companion backend document).

## 3. Header: content and behavior

**Primary group, no large gap between name and rank:**
- Steam avatar 64–88px, image fallback, external Steam link.
- Steam display name in Geist with ellipsis only as necessary; hover/touch accessible full text.
- Official rank **directly adjacent to/beneath the name**, with a real badge asset and English rank name, e.g. `Acolyte VI`. Avoid putting the rank in a disconnected far-right column.
- Display calibration/placement count, points, season and progression **only if the backend supplies reliable values**. Never infer these fields from rank tier alone.
- Three top hero portraits in a compact right-side group; each has tooltip with hero name, played matches, winrate and sample. They are a preview, not a replacement for the deeper Top Heroes widget.
- Last observed match date/updated date; explicit stale indicator as necessary.
- Actions: Follow/Unfollow (auth required), Share (copy profile URL at minimum; future PNG export), Refresh (respect existing 60s shared backend cooldown), secondary Steam link and Copy SteamID in overflow menu.
- Unknown vs unranked vs calibration are distinct states. Do not draw a fake rank badge.

**No repeated monster KPI strip in header.** The big metrics belong to Recent Performance.

## 4. Global filters and query-string state

Use one coherent state model for `period`, `gameMode`, `matchMode`. Suggested canonical query state: `/players/:steamId?tab=overview&period=30d&gameMode=normal&matchMode=all`.

- `period`: `7d`, `30d`, `season`. Season must have a verified start date. If unknown, explicitly describe the fallback rather than silently inventing it.
- `gameMode`: `all`, `normal`, `street_brawl`; optionally show supported others under an advanced menu. This identifies game formats (e.g. 6v6 vs Street Brawl).
- `matchMode`: `all`, `ranked`, `unranked`; other modes as source supports. This identifies matchmaking type. `ranked` and `normal` are **NOT** values of the same dimension.
- Initial default can be `period=30d`, `gameMode=all`, `matchMode=all`, so new accounts are not unexpectedly empty. Final defaults should be validated against real user data.
- Filter chips and labels display actual scope; no hidden re-use of career totals under a 30-day label.
- Player identity and official current rank do **not** change when filtering by mode/period.
- Hero/result filters local to the Match History widget must not unexpectedly change summary KPI or trend chart; explicit scope.
- History tab retains its own filters in URL, supports back/forward and direct share. Validate and canonicalize invalid params.
- For multi-dimensional filtering, do not imply a combined source selector that the API cannot represent. A compact dropdown plus nested matchmaking selector is acceptable.

## 5. Left rail widgets

| Widget | Data | UX behavior | Phase |
|---|---|---|---|
| Rank & Modes | Official rank and accurate W/L by mode | Rank readable, sample counts, click mode to update global filter | P0 |
| Recent Activity | Last 12 weeks of daily match counts; W/L when available | Heatmap intensity by activity (not fabricated winrate colors); tooltip and keyboard readout | P0 if complete coverage; otherwise explicit partial |
| Top Heroes | Top 3 by matches in selected scope; matches, W/L, KDA | Click opens `Héros` tab with hero selected | P0 |
| Period Delta | Last 20 eligible matches vs previous 20, equal-sized samples | Show comparisons only when 40 valid matches exist; not invented 'performance score' | P1 |
| Played With / Against | Other player account IDs, games together, W/L | Change teammates/adversaries and open player profiles; don't label inferred party as confirmed friends | P1 |

**Prevent semantic duplication:** Header top-3 hero portraits are a fast visual identity cue; left rail Top Heroes provides actual metrics.

## 6. Right upper widget: Recent Performance

- The default interactive chart is **per-match KDA** of recent eligible matches. Alternative metrics: 10-match rolling winrate and net worth per minute, with correct axis/unit labels.
- Mini KPI row: winrate (W/L and denominator), aggregate KDA (complete match denominator), matches count, net worth/min; dimensions and labels consistent with selected period/mode.
- Chart defaults to last 20 matches *within the current global filters*, not 'last 20 career' when period is 7d.
- Per-match tooltip: timestamp, hero, result, K/D/A, metric value. Link on selection to match detail if applicable.
- Graph has real axes, dates, keyboard navigation, touch behavior, markers for win/loss that do not distort y-values, and reduced-motion behavior.
- **Null values split series**, never silently forward-fill, treat null as zero, or extrapolate.
- Rolling winrate is undefined until a full 10 eligible matches exist. Display gaps rather than biased first-nine values.
- If fewer than two valid data points, show a clear 'Insufficient data' state; don't invent trends.
- Future performance views can reuse these chart primitives; don't introduce a proprietary player skill score.

## 7. Right lower widget: Recent Match History

**Overview shows five latest eligible matches**, and a link/button to the full `Parties` tab. The full tab has server-backed filtering/pagination.

**Row at desktop 64–72px (target, verify at real breakpoint widths):**
- Compact left outcome stripe (win/loss) and result label.
- Hero portrait + hero name, display mode, relative/absolute date and duration.
- Large legible K / D / A and optional KDA.
- Net worth and net worth/min (only if known).
- A single horizontal row of small item icons **when item purchase data is available**; no fake item images in production.
- Participant mini-icons only when relevant and within available width; participant list/details can live in expand panel.
- A dedicated chevron expands in place; a separate explicit 'Détail du match' action navigates. No ambiguous whole-row click.

**Expansion area:** full buy/item summary, other participants, damage/objective metrics if available, data coverage indicator, link to match detail. Only fetch extra match metadata when a row expands; cache by match ID, dedupe calls across screens. If data unavailable, hide that section rather than show placeholder false facts.

**Compact responsive behavior:** at 1280-1440 with sidebar, prioritize outcome, hero, K/D/A, date/duration. Collapse item row/participants into expansion if needed. On 390px mobile, stack two tight text lines, keep minimum 44px touch targets for expansion and navigation. Don't create horizontal page overflow or reduce fonts to microscopic sizes.

**Match filters**: hero, result, date/period, match mode, game mode, sort. They must filter full server-side history before cursor pagination, not only loaded chunks. Reset/recompute cursor when filters change.

## 8. Other tabs (scope for this rebuild)

- `Parties`: full dense list, filters and pagination; same `MatchRow` component, not duplicated markup.
- `Héros`: searchable/sortable table or list of the player's hero stats, with hero portraits, match counts, winrate, KDA. Period and modes should match global filters after backend support.
- `Performance`, `Rang`, `Coéquipiers`: **do not show dead tabs**; specification only until real contracts exist. Implement only when data and tests support them.
- Share PNG: a distinct accessible export component can be P1 after the profile functions, while basic link share remains P0.

## 9. Data semantics and trustworthiness

1. A requested period, actual observed date range, sample sizes, isPartial and isStale must be visible through a concise info tooltip/badge; no long legal footnotes everywhere.
2. Historical source is filtered by back to valid outcomes (win=1 / loss=2); do not relabel penalized/unscored matches as losses. Coverage should disclose this policy.
3. Per-match KDA = `(K+A)/max(D,1)` when all fields are known; aggregate KDA = `(sum(K)+sum(A))/max(sum(D),1)` over rows with *all three* fields present. Compare the same eligible set.
4. Net worth per minute = `netWorth/(durationSeconds/60)` only for positive valid duration and known worth.
5. No sample => `null`, not zero. Display `—` with accessible tooltip or explanation.
6. For full-career claims, require complete coverage. Otherwise say 'among observed matches'.
7. Do not show 'top 1% of players' unless cohorts are computed on **per-player** metrics with matching time/mode/rank constraints.
8. Current official rank cannot be derived from an invented MMR. Use rank fields reported by source, with Eternus nuances.
9. Avoid treating a player's overall winrate as equivalent to match-specific winrate or hero winrate from a different period.

## 10. Loading, error, empty, and permissions states

- Header visible once public Steam profile loads even if history fails.
- Independent skeletons for summary, heatmap, hero list, chart, matches and details.
- API unavailable: preserve unrelated widgets, provide local retry.
- Source stale: show last update and badge, keep cached data.
- Partial coverage: mark precise modules / metrics; disable unsupported charts rather than fabricating.
- No matches, single match, no rank, placement, unknown mode, private data, missing images, unknown hero, unavailable item assets.
- Public profile accessible without Steam login; Follow requires Steam auth; Share link works without login.
- `prefers-reduced-motion`, keyboard, screen reader, contrast and colorblind-safe win/loss labels.

## 11. Implementation phases

**Phase A / foundation**
- Sync `src/contracts/openapi.yaml` to backend v1.8.0 and update frontend mode/inferred types & UI without breaking mocks; test.
- Extract reusable small presentational components and query-state parsing; implement MSW fixture scenario matrix.

**Phase B / P0 profile**
- New compact header, left rail and right performance/matches; true data bindings to current endpoints.
- Use visible accurate scope labels when server filtered overview isn't yet available. No pretend filter behavior.
- Remove/restructure cluttered old `OverviewTab` only once functional parity is checked.

**Phase C / P0 backend integration**
- Add server-side filtered `/overview`, `/matches` and `/heroes` per `02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md` after backend agreement.
- Cross-check result totals and date scopes. Implement server cursor/filter semantics and heatmap coverage.

**Phase D / enrich**
- Lazy detail data per match, item icons when real metadata exists, performance delta, co-player stats, future item catalogue and share image.

## 12. Acceptance tests

- Viewport snapshots and interaction tests at 320, 390, 768, 1024, 1280, 1440, 1920 and 2560px.
- Header name and rank grouped on all breakpoints, without truncating critical rank information.
- 64–72px standard desktop match rows where width permits; 76–88px mobile target, with no unreadable text.
- Hero/results/date filtering affects the correct dataset and URL, not only loaded rows.
- KDA and winrate calculations match fixture-based reference values.
- Invalid/null/partial data handled without fake zeroes or misleading charts.
- Mode fields `gameMode` and `matchMode` distinguish game format vs matchmaking type.
- Steam Follow/login, Refresh, Share and match navigation work; no regressions in other routes.
- Existing shell and landing remain unchanged except necessary shared components; preserve approved motion behavior.
- typecheck, lint, unit tests, Playwright tests and build pass. If browser unavailable, report explicitly, do not claim visual QA.

## 13. Backlog explicitly out of scope

Guilds, sharing guild roles/invitations, item build editor, item usage pages, detailed item shop economy, proprietary performance scoring, automated coaching. Item catalogue is an approved **future infrastructure requirement**, not a reason to delay profile V2. See backend contract document for the proposed versioned catalogue/cache design.
