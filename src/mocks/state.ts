import playersFixture from "./fixtures/players.json";
import trackedFixture from "./fixtures/tracked-players.json";
import usersFixture from "./fixtures/users.json";
import type { Group, MatchSummary, PlayerProfile, PublicUser, TrackedPlayer } from "@/api/types";
import {
  CORVID_STEAM_ID,
  GROUP_PLAYERS,
  rankFor,
  statsFromMatches,
  syntheticMatches,
} from "./synthetic";

type MockUser = PublicUser;

export interface MockState {
  users: MockUser[];
  tracked: Map<string, TrackedPlayer[]>;
  groups: Map<string, Group[]>;
}

const clone = <T>(value: T): T => structuredClone(value);

const DEMO_USER_ID = "507f1f77bcf86cd799439011";

const demoGroup: Group = {
  id: "607f1f77bcf86cd799439021",
  name: "Équipe du vendredi",
  steamIds: [CORVID_STEAM_ID, ...GROUP_PLAYERS.map((p) => p.steamId)],
  createdAt: "2026-11-10T18:00:00.000Z",
  updatedAt: "2026-11-10T18:00:00.000Z",
};

function initialState(): MockState {
  const { _note: _a, ...trackedByUser } = trackedFixture;
  void _a;
  return {
    users: clone(usersFixture.users),
    tracked: new Map(Object.entries(clone(trackedByUser)) as [string, TrackedPlayer[]][]),
    groups: new Map([[DEMO_USER_ID, [clone(demoGroup)]]]),
  };
}

export let state: MockState = initialState();

/** Remet le stockage en memoire a son etat de depart (tests, rechargement). */
export function resetMockState(): void {
  state = initialState();
}

export const mockConfig = { latencyMs: 0 };

type Fixture = Omit<PlayerProfile, "meta"> & { partial?: boolean };

const identity = (steamId: string, accountId: number, displayName: string) => ({
  steamId,
  accountId,
  displayName,
  avatarUrl: null,
  region: "FR",
});

const fromJson = playersFixture.players as unknown as Fixture[];

/** Corvid et ses coéquipiers : statistiques calculées depuis leurs parties synthétiques. */
export const playerFixtures: Fixture[] = [
  ...fromJson.map((p) =>
    p.player.steamId === CORVID_STEAM_ID
      ? {
          ...p,
          stats: statsFromMatches(syntheticMatches[CORVID_STEAM_ID] ?? []),
          rank: rankFor(8, 4),
        }
      : p,
  ),
  ...GROUP_PLAYERS.map((g) => ({
    player: identity(g.steamId, g.accountId, g.displayName),
    stats: statsFromMatches(syntheticMatches[g.steamId] ?? []),
    rank: rankFor(g.tier, g.subrank),
  })),
];

export const matchFixtures: Record<string, MatchSummary[]> = syntheticMatches;
