/**
 * Données SYNTHETIQUES du mode mock : joueurs, parties, classements et statistiques de
 * méta sont fabriqués de façon déterministe. Seul le catalogue (héros, rangs, images) est réel.
 */
import heroesFixture from "./fixtures/heroes.json";
import ranksFixture from "./fixtures/ranks.json";
import type {
  BestMatch,
  ComparePeriod,
  GroupMemberStats,
  HeroDetail,
  PlayerRank,
  RankPoint,
  HeroMetaStats,
  LeaderboardEntry,
  LeaderboardRegion,
  MatchDetail,
  MatchPlayer,
  MatchSummary,
  PlayerHeroStat,
  PlayerStats,
  RankTier,
} from "@/api/types";

export const heroes = heroesFixture as unknown as HeroDetail[];
export const ranks = ranksFixture as unknown as RankTier[];

export const heroById = (id: number) => heroes.find((h) => h.id === id);

/** Générateur pseudo-aléatoire déterministe (LCG). */
export function seeded(seed: number) {
  let s = seed >>> 0;
  const next = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const int = (a: number, b: number) => a + Math.floor(next() * (b - a + 1));
  const pick = <T>(list: readonly T[]) => list[int(0, list.length - 1)] as T;
  return { next, int, pick };
}

const FIRST = [
  "Nox",
  "Vesper",
  "Ashen",
  "Cinder",
  "Lumen",
  "Rook",
  "Mire",
  "Sable",
  "Quill",
  "Ember",
  "Hollow",
  "Argent",
  "Thorn",
  "Wisp",
  "Onyx",
  "Zephyr",
  "Ivory",
  "Gale",
  "Dusk",
  "Flint",
];
const SECOND = [
  "Fox",
  "Hawk",
  "Moth",
  "Wolf",
  "Lynx",
  "Crow",
  "Stag",
  "Newt",
  "Wren",
  "Toad",
  "Ibis",
  "Mink",
  "Orca",
  "Pike",
  "Slug",
];

export const fakeName = (r: ReturnType<typeof seeded>) =>
  `${r.pick(FIRST)}${r.pick(SECOND)}${r.int(1, 99)}`;

export const CORVID_STEAM_ID = "76561198000000000";

export interface SyntheticPlayer {
  steamId: string;
  accountId: number;
  displayName: string;
  tier: number;
  subrank: number;
  matches: number;
  wins: number;
  seed: number;
  heroPool: number[];
}

const accountOf = (steamId: string) => Number(BigInt(steamId) - 76561197960265728n);

/** Coéquipiers fictifs du groupe de démonstration. */
export const GROUP_PLAYERS: SyntheticPlayer[] = [
  {
    steamId: "76561198000000010",
    displayName: "NoxFox12",
    tier: 9,
    subrank: 2,
    matches: 38,
    wins: 25,
    seed: 11,
    heroPool: [2, 3, 11, 15],
  },
  {
    steamId: "76561198000000011",
    displayName: "SableLynx7",
    tier: 7,
    subrank: 5,
    matches: 30,
    wins: 14,
    seed: 12,
    heroPool: [4, 8, 12, 18],
  },
  {
    steamId: "76561198000000012",
    displayName: "WrenIvory3",
    tier: 8,
    subrank: 1,
    matches: 45,
    wins: 27,
    seed: 13,
    heroPool: [6, 14, 19, 20],
  },
  {
    steamId: "76561198000000013",
    displayName: "MinkEmber9",
    tier: 6,
    subrank: 3,
    matches: 22,
    wins: 9,
    seed: 14,
    heroPool: [7, 16, 25, 31],
  },
].map((p) => ({ ...p, accountId: accountOf(p.steamId) }));

export const CORVID: SyntheticPlayer = {
  steamId: CORVID_STEAM_ID,
  accountId: 39734272,
  displayName: "Corvid",
  tier: 8,
  subrank: 4,
  matches: 42,
  wins: 24,
  seed: 7,
  heroPool: [1, 6, 7, 10, 13, 17, 27],
};

export function buildMatches(p: SyntheticPlayer): MatchSummary[] {
  const r = seeded(p.seed);
  const pool = p.heroPool.filter((id) => heroById(id));
  const outcomes: ("win" | "loss")[] = [
    ...Array<"win">(p.wins).fill("win"),
    ...Array<"loss">(p.matches - p.wins).fill("loss"),
  ];
  for (let i = outcomes.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [outcomes[i], outcomes[j]] = [outcomes[j] as "win" | "loss", outcomes[i] as "win" | "loss"];
  }
  const base = Date.parse("2026-11-15T20:00:00.000Z");
  return outcomes.map((outcome, i) => {
    const hero = heroById(r.pick(pool))!;
    const win = outcome === "win";
    const duration = r.int(1500, 2700);
    return {
      matchId: String(p.seed * 10_000_000 + 123456789 - i),
      playedAt: new Date(base - i * 86400000 * 0.75).toISOString(),
      heroId: hero.id,
      heroName: hero.name,
      heroImageUrl: hero.images.small,
      outcome,
      durationSeconds: duration,
      kills: win ? r.int(6, 16) : r.int(2, 10),
      deaths: win ? r.int(2, 8) : r.int(5, 12),
      assists: r.int(4, 20),
      netWorth: Math.round((duration * (win ? 19 : 15) + r.int(0, 2000)) / 100) * 100,
    };
  });
}

export const corvidMatches = buildMatches(CORVID);
/** Parties de tous les joueurs synthétiques, par SteamID. */
export const syntheticMatches: Record<string, MatchSummary[]> = Object.fromEntries(
  [CORVID, ...GROUP_PLAYERS].map((p) => [p.steamId, buildMatches(p)]),
);

const round2 = (n: number) => Math.round(n * 100) / 100;

export function statsFromMatches(matches: MatchSummary[]): PlayerStats {
  const sum = (k: "kills" | "deaths" | "assists") => matches.reduce((s, m) => s + (m[k] ?? 0), 0);
  const wins = matches.filter((m) => m.outcome === "win").length;
  const kills = sum("kills");
  const deaths = sum("deaths");
  const assists = sum("assists");
  return {
    matchesPlayed: matches.length,
    wins,
    losses: matches.length - wins,
    winRate: matches.length ? round2((wins / matches.length) * 100) : null,
    kills,
    deaths,
    assists,
    kda: deaths ? round2((kills + assists) / deaths) : null,
  };
}

export function heroBreakdown(matches: MatchSummary[]): PlayerHeroStat[] {
  const byHero = new Map<number, MatchSummary[]>();
  for (const m of matches) byHero.set(m.heroId, [...(byHero.get(m.heroId) ?? []), m]);
  return [...byHero.entries()]
    .map(([heroId, list]) => {
      const s = statsFromMatches(list);
      return {
        heroId,
        heroName: list[0]?.heroName ?? "",
        heroImageUrl: list[0]?.heroImageUrl ?? null,
        matches: list.length,
        wins: s.wins ?? 0,
        winRate: s.winRate,
        kda: s.kda,
      };
    })
    .sort((a, b) => b.matches - a.matches);
}

export function heroMetaStats(heroId: number): HeroMetaStats {
  const r = seeded(heroId * 9973);
  const base = 46 + r.next() * 10;
  return {
    heroId,
    matches: r.int(8000, 60000),
    winRate: round2(base),
    pickRate: round2(1 + r.next() * 7),
    avgKills: round2(5 + r.next() * 5),
    avgDeaths: round2(4 + r.next() * 3),
    avgAssists: round2(7 + r.next() * 7),
    winRateByTier: ranks.map((rank) => ({
      tier: rank.tier,
      winRate: rank.tier === 0 ? null : round2(base + (r.next() - 0.5) * 6),
      matches: rank.tier === 0 ? null : r.int(300, 6000),
    })),
  };
}

export function leaderboard(region: LeaderboardRegion): LeaderboardEntry[] {
  const r = seeded([...region].reduce((s, c) => s + c.charCodeAt(0), 0));
  return Array.from({ length: 50 }, (_, i) => {
    const tier = i < 8 ? 11 : i < 25 ? 10 : 9;
    const subrank = 6 - (i % 6);
    const rank = ranks.find((x) => x.tier === tier)!;
    const top = Array.from({ length: 3 }, () => r.pick(heroes));
    return {
      rank: i + 1,
      displayName: fakeName(r),
      steamId: null,
      badge: {
        tier,
        subrank,
        name: rank.name,
        imageUrl: rank.subranks[subrank - 1] ?? rank.imageUrl,
      },
      topHeroes: [...new Map(top.map((h) => [h.id, h])).values()].map((h) => ({
        heroId: h.id,
        name: h.name,
        imageUrl: h.images.small,
      })),
    };
  });
}

/** Détail d'une partie de Corvid : 6 joueurs par équipe, adversaires synthétiques. */
export function matchDetail(summary: MatchSummary, owner: SyntheticPlayer = CORVID): MatchDetail {
  const r = seeded(Number(summary.matchId) % 1_000_000);
  const duration = summary.durationSeconds ?? 2000;
  const corvidSide = r.next() > 0.5 ? "amber" : "sapphire";
  const otherSide = corvidSide === "amber" ? "sapphire" : "amber";
  const winningSide = summary.outcome === "win" ? corvidSide : otherSide;
  const used = new Set<number>([summary.heroId]);

  const makePlayer = (win: boolean): MatchPlayer => {
    let hero = r.pick(heroes);
    while (used.has(hero.id)) hero = r.pick(heroes);
    used.add(hero.id);
    return {
      steamId: null,
      displayName: fakeName(r),
      heroId: hero.id,
      heroName: hero.name,
      heroImageUrl: hero.images.small,
      level: r.int(18, 30),
      kills: win ? r.int(4, 14) : r.int(1, 9),
      deaths: win ? r.int(2, 8) : r.int(4, 12),
      assists: r.int(3, 18),
      netWorth: Math.round((duration * (win ? 18 : 15) + r.int(0, 3000)) / 100) * 100,
      lastHits: r.int(90, 260),
      denies: r.int(2, 30),
    };
  };

  const corvid: MatchPlayer = {
    steamId: owner.steamId,
    displayName: owner.displayName,
    heroId: summary.heroId,
    heroName: summary.heroName,
    heroImageUrl: summary.heroImageUrl ?? null,
    level: r.int(22, 30),
    kills: summary.kills,
    deaths: summary.deaths,
    assists: summary.assists,
    netWorth: summary.netWorth,
    lastHits: r.int(120, 260),
    denies: r.int(4, 30),
  };
  const corvidWins = summary.outcome === "win";
  const sortWorth = (list: MatchPlayer[]) =>
    list.sort((a, b) => (b.netWorth ?? 0) - (a.netWorth ?? 0));

  return {
    matchId: summary.matchId,
    playedAt: summary.playedAt,
    durationSeconds: summary.durationSeconds,
    winningSide,
    teams: [
      {
        side: corvidSide,
        outcome: summary.outcome,
        players: sortWorth([corvid, ...Array.from({ length: 5 }, () => makePlayer(corvidWins))]),
      },
      {
        side: otherSide,
        outcome: summary.outcome === "win" ? "loss" : "win",
        players: sortWorth(Array.from({ length: 6 }, () => makePlayer(!corvidWins))),
      },
    ].sort((a) => (a.side === "amber" ? -1 : 1)) as MatchDetail["teams"],
  };
}

export const rankScore = (tier: number, subrank: number) => tier * 6 + subrank;

export function rankFor(tier: number, subrank: number): PlayerRank {
  const rank = ranks.find((r) => r.tier === tier);
  return {
    badgeId: null,
    name: rank ? `${rank.name} ${subrank}` : null,
    tier,
    subrank,
    imageUrl: rank?.subranks[subrank - 1] ?? rank?.imageUrl ?? null,
    color: rank?.color ?? null,
  };
}

/** Historique de rang synthétique : la tendance suit les victoires, il se termine au rang actuel. */
export function rankHistory(p: SyntheticPlayer, matches: MatchSummary[]): RankPoint[] {
  const ordered = [...matches].reverse();
  const end = rankScore(p.tier, p.subrank);
  const deltas = ordered.map((m, i) => (i % 2 === 0 ? (m.outcome === "win" ? 1 : -1) : 0));
  let score = end - deltas.reduce<number>((s, d) => s + d, 0);
  return ordered.map((m, i) => {
    score += deltas[i] ?? 0;
    return { at: m.playedAt, score: Math.max(6, score) };
  });
}

function longestWinStreak(matches: MatchSummary[]): number {
  let best = 0;
  let run = 0;
  for (const m of [...matches].reverse()) {
    run = m.outcome === "win" ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

const PERIOD_DAYS: Record<ComparePeriod, number | null> = { "7d": 7, "30d": 30, season: null };

/** Statistiques d'un membre sur une période, calculées depuis ses parties synthétiques. */
export function memberStats(
  p: SyntheticPlayer,
  all: MatchSummary[],
  period: ComparePeriod,
  now = Date.parse("2026-11-16T12:00:00.000Z"),
): GroupMemberStats {
  const days = PERIOD_DAYS[period];
  const inPeriod = all.filter(
    (m) => days === null || Date.parse(m.playedAt) >= now - days * 86400000,
  );
  const s = statsFromMatches(inPeriod);
  const best = [...inPeriod]
    .filter((m) => m.kills !== null && m.assists !== null && m.deaths !== null)
    .map((m) => ({ m, kda: ((m.kills ?? 0) + (m.assists ?? 0)) / Math.max(1, m.deaths ?? 1) }))
    .sort((a, b) => b.kda - a.kda)[0];
  const bestMatch: BestMatch | null = best
    ? {
        matchId: best.m.matchId,
        playedAt: best.m.playedAt,
        heroName: best.m.heroName,
        heroImageUrl: best.m.heroImageUrl ?? null,
        kills: best.m.kills ?? 0,
        deaths: best.m.deaths ?? 0,
        assists: best.m.assists ?? 0,
        netWorth: best.m.netWorth,
        kda: round2(best.kda),
      }
    : null;
  const history = rankHistory(p, all).filter(
    (pt) => days === null || Date.parse(pt.at) >= now - days * 86400000,
  );
  return {
    steamId: p.steamId,
    displayName: p.displayName,
    avatarUrl: null,
    rank: rankFor(p.tier, p.subrank),
    matches: inPeriod.length,
    wins: s.wins ?? 0,
    losses: s.losses ?? 0,
    winRate: s.winRate,
    kda: s.kda,
    longestWinStreak: longestWinStreak(inPeriod),
    bestMatch,
    rankHistory: history,
  };
}

export const allSyntheticPlayers = [CORVID, ...GROUP_PLAYERS];
