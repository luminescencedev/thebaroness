import type {
  CompareScope,
  Group,
  GroupCompareResponse,
  GroupPairItem,
  GroupPairs,
  GroupUnavailableReason,
  GroupWithMembers,
  MemberIdentity,
} from "@/api/types";
import { SCENARIOS } from "./scenarios";
import { groupHighlights, HIGHLIGHT_MIN_MATCHES } from "./groupHighlights";
import {
  MOCK_SEASONS,
  allSyntheticPlayers,
  memberStats,
  periodFromMs,
  syntheticMatches,
} from "./synthetic";

/**
 * Réponses de groupe du mock (back v1.15.0). Les valeurs sont SYNTHETIQUES ; seules les règles reproduisent le
 * contrat : membres indisponibles nommés, filtres de mode, période précédente, saisons, parties communes
 * « même équipe ».
 */
const NOW = Date.parse("2026-11-16T12:00:00.000Z");

/** Raison d'indisponibilité d'un membre du mock. */
export function unavailableReason(steamId: string): GroupUnavailableReason | null {
  if (steamId === SCENARIOS.steamIdUnavailable) return "provider_error";
  if (steamId === SCENARIOS.steamIdRateLimited) return "rate_limited";
  return allSyntheticPlayers.some((p) => p.steamId === steamId) ? null : "not_found";
}

export function memberIdentity(steamId: string): MemberIdentity {
  const p = allSyntheticPlayers.find((x) => x.steamId === steamId);
  return p
    ? { steamId, displayName: p.displayName, avatarUrl: null, resolved: true }
    : { steamId, displayName: steamId, avatarUrl: null, resolved: false };
}

export function groupsWithMembers(groups: Group[]): {
  items: GroupWithMembers[];
  membersCoverage: {
    requested: number;
    resolved: number;
    fetched: number;
    providerFailed: boolean;
  };
} {
  const ids = [...new Set(groups.flatMap((g) => g.steamIds))];
  const resolved = ids.filter((id) => memberIdentity(id).resolved).length;
  return {
    items: groups.map((g) => ({ ...g, members: g.steamIds.map(memberIdentity) })),
    membersCoverage: {
      requested: ids.length,
      resolved,
      fetched: ids.length - resolved,
      providerFailed: false,
    },
  };
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Parties communes SYNTHETIQUES : déterministes par paire, réduites par période et modes, « même équipe » seulement. */
function pairsOf(ids: string[], missing: string[], scope: CompareScope): GroupPairs {
  const scale =
    (scope.period === "7d" ? 0.25 : scope.period === "season" ? 0.5 : 1) *
    (scope.matchMode === "ranked" ? 0.5 : scope.matchMode === "unranked" ? 0.5 : 1) *
    (scope.gameMode === "street_brawl" ? 0.2 : 1);
  const present = ids.filter((id) => !missing.includes(id));
  const items: GroupPairItem[] = [];
  let evaluated = 0;
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      evaluated++;
      const a = present[i]!;
      const b = present[j]!;
      const h = hash(a + b);
      if (h % 3 === 0) continue; // pas de partie commune : absente de `items`
      const matches = Math.round((4 + (h % 27)) * scale);
      if (matches < 1) continue;
      const wins = Math.round(matches * (0.4 + ((h >> 3) % 40) / 100));
      items.push({
        steamIds: [a, b],
        together: {
          matches,
          wins,
          losses: matches - wins,
          winRate: Math.round((wins / matches) * 10000) / 100,
          lastPlayedAt: new Date(NOW - ((h >> 5) % 6) * 86_400_000).toISOString(),
        },
        against: { matches: (h >> 7) % 4 === 0 ? 1 : 0, firstWins: 0 },
      });
    }
  }
  items.sort((x, y) => y.together.matches - x.together.matches);
  return {
    scope: {
      relation: "same_team",
      partyConfirmed: false,
      basis: "match_history_intersection",
      period: scope.period,
      gameMode: scope.gameMode,
      matchMode: scope.matchMode,
    },
    items,
    coverage: {
      membersIncluded: present.length,
      membersMissing: missing,
      pairsEvaluated: evaluated,
      pairsWithCommonMatches: items.length,
    },
  };
}

export function compareResponse(
  group: Group,
  scope: CompareScope,
  opts: { pairs: boolean },
): { body: Omit<GroupCompareResponse, "meta">; missing: number } {
  const unavailable = group.steamIds.flatMap((steamId) => {
    const reason = unavailableReason(steamId);
    return reason ? [{ steamId, reason }] : [];
  });
  const members = group.steamIds.flatMap((steamId) => {
    const p = allSyntheticPlayers.find((x) => x.steamId === steamId);
    return p && !unavailableReason(steamId)
      ? [memberStats(p, syntheticMatches[steamId] ?? [], scope.period, scope)]
      : [];
  });
  const from = periodFromMs(scope.period);
  const seasons = MOCK_SEASONS.filter((s) => s.endedAt === null || Date.parse(s.endedAt) > from);
  const days = scope.period === "7d" ? 7 : scope.period === "30d" ? 30 : null;
  return {
    missing: unavailable.length,
    body: {
      group,
      period: scope.period,
      appliedFilters: scope,
      members,
      unavailable,
      highlights: groupHighlights(members),
      ...(opts.pairs
        ? {
            pairs: pairsOf(
              group.steamIds,
              unavailable.map((u) => u.steamId),
              scope,
            ),
          }
        : {}),
      methodology: {
        periodFrom: new Date(from).toISOString(),
        rankScore: "tier * 6 + sous-rang",
        kda: "(K + A) / max(D, 1) sur les parties où K, D et A sont connus",
        highlightMinMatches: HIGHLIGHT_MIN_MATCHES,
        ties: "tous les ex æquo sont conservés",
        rankDeltaScope: "latest_season_in_period",
        seasons,
        seasonBoundariesKnown: true,
        previousPeriod:
          days === null
            ? null
            : {
                from: new Date(from - days * 86_400_000).toISOString(),
                to: new Date(from).toISOString(),
              },
      },
    },
  };
}
