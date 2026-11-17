# The Baroness — Player Profile V2 delivery pack

Date 2026-11-17. **No changes were pushed to GitHub; no repository was modified.** Documentation and prompts only.

## Repositories reviewed

- Front: https://github.com/luminescencedev/thebaroness/tree/refonte-ui @ `84de6a49cf3ec2e607fc892a35145272520516cd`.
- Back: https://github.com/LilStick/thebaroness-back @ `228064057f899d5949e5a6df89e41c34abc17165`.
- Backend reference contract `docs/openapi.yaml` **1.8.0**; frontend checked `src/contracts/openapi.yaml` is **1.6.0**. The first frontend task is to reconcile this mismatch.

## Files

1. `01_PLAYER_PROFILE_V2_SPEC.md` — comprehensive approved profile UX/data contract.
2. `02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md` — proposed additive endpoints, examples, filters, cache and future item catalog notes.
3. `03_HANDOFF_APPEND_PROFILE_V2.md` — section to **append** to existing front `docs/HANDOFF.md` (do not replace the handoff).
4. `04_CLAUDE_CODE_FRONTEND_PROMPT.md` — complete standalone ready-to-copy implementation prompt for Claude Code in frontend `refonte-ui`.
5. `05_CLAUDE_CODE_BACKEND_PROMPT.md` — complete standalone backend prompt for your teammate in `LilStick/thebaroness-back`.
6. `the-baroness-player-profile-v2.1.html` — approved interactive **reference prototype**, with fictional data, not production code.

## How to use

### Frontend (your task)

Copy file 1 to `docs/design/player-profile-v2/PRODUCT_SPEC.md`, file 2 to `docs/back-player-profile-v2-contract.md`, the HTML reference to `docs/design/player-profile-v2/prototype-v2.1.html`. Append file 3 to `docs/HANDOFF.md` after reviewing the latest version; don't overwrite any existing sections. Provide file 4 to Claude Code, starting from the current `refonte-ui` working tree. Do not mix with previous add-on prompts: file 4 is consolidated and self-sufficient.

### Backend (teammate)

Give files 1, 2, 3, 5 and the current frontend handoff to the teammate. They run file 5 as their independent Claude Code prompt in the backend repository. They should update their **own** handoff when deliveries are actually made and convey the new OpenAPI version, rather than changing frontend routes preemptively.

### Coordination order

1. Front aligns **already-shipped** backend OpenAPI v1.8.0 / mode fields.
2. Both agree P0 filter semantics and DTOs.
3. Front reconstructs the profile with existing real endpoints + honest partial states and mock contract adapters.
4. Backend implements `/overview`, server-filtered `/matches` and `/heroes`; front integrates after confirmed delivery.
5. Add P1 activity/rank/relationships, rich match detail, then item catalog/builds later.

## Guardrails

- No unapproved commits or pushes; preserve both existing worktrees.
- `gameMode` (normal/Street Brawl) is different from `matchMode` (ranked/unranked).
- `null` is not zero; never fabricate performance scores, match item purchases or player percentiles.
- Do not require new backend endpoints for the current landing or the shell.
- This is a **planning/build handoff**, not evidence that P0 or P1 code was implemented or tested.
