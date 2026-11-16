import playersFixture from "./fixtures/players.json";
import trackedFixture from "./fixtures/tracked-players.json";
import usersFixture from "./fixtures/users.json";
import matchesFixture from "./fixtures/matches.json";
import type { MatchSummary, PlayerProfile, TrackedPlayer } from "@/api/types";

interface MockUser {
  id: string;
  email: string;
  password: string;
}

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

export const playerFixtures = playersFixture.players as unknown as (Omit<PlayerProfile, "meta"> & {
  partial?: boolean;
})[];

export const matchFixtures = matchesFixture as Record<string, MatchSummary[]>;
