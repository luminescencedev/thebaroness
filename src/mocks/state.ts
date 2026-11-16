import playersFixture from "./fixtures/players.json";
import trackedFixture from "./fixtures/tracked-players.json";
import usersFixture from "./fixtures/users.json";
import type { MatchSummary, PlayerProfile, PublicUser, TrackedPlayer } from "@/api/types";
import { CORVID_STEAM_ID, corvidMatches, ranks, statsFromMatches } from "./synthetic";

type MockUser = PublicUser;

export interface MockState {
  users: MockUser[];
  tracked: Map<string, TrackedPlayer[]>;
}

const clone = <T>(value: T): T => structuredClone(value);

function initialState(): MockState {
  const { _note: _a, ...trackedByUser } = trackedFixture;
  void _a;
  return {
    users: clone(usersFixture.users),
    tracked: new Map(Object.entries(clone(trackedByUser)) as [string, TrackedPlayer[]][]),
  };
}

export let state: MockState = initialState();

/** Remet le stockage en memoire a son etat de depart (tests, rechargement). */
export function resetMockState(): void {
  state = initialState();
}

export const mockConfig = { latencyMs: 0 };

type Fixture = Omit<PlayerProfile, "meta"> & { partial?: boolean };

const oracle = ranks.find((r) => r.tier === 8);

/** Corvid : Oracle 4, statistiques calculées depuis ses 42 parties synthétiques. */
export const playerFixtures: Fixture[] = (playersFixture.players as unknown as Fixture[]).map(
  (p) =>
    p.player.steamId === CORVID_STEAM_ID
      ? {
          ...p,
          stats: statsFromMatches(corvidMatches),
          rank: {
            badgeId: null,
            name: "Oracle 4",
            tier: 8,
            subrank: 4,
            imageUrl: oracle?.subranks[3] ?? oracle?.imageUrl ?? null,
            color: oracle?.color ?? null,
          },
        }
      : p,
);

export const matchFixtures: Record<string, MatchSummary[]> = { [CORVID_STEAM_ID]: corvidMatches };
