/**
 * Données SYNTHETIQUES du mode mock : joueurs, parties, classements et statistiques de
 * méta sont fabriqués de façon déterministe. Seul le catalogue (héros, rangs, images) est réel.
 */
import heroesFixture from "./fixtures/heroes.json";
import ranksFixture from "./fixtures/ranks.json";
import type {
  HeroDetail,
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

/** Joueur d'exemple (Corvid) : 42 parties, 24 victoires, 18 défaites. */
export const CORVID_STEAM_ID = "76561198000000000";
const CORVID_HEROES = [1, 6, 7, 10, 13, 17, 27].filter((id) => heroById(id));

function buildCorvidMatches(): MatchSummary[] {
  const r = seeded(7);
  const outcomes: ("win" | "loss")[] = [
    ...Array<"win">(24).fill("win"),
    ...Array<"loss">(18).fill("loss"),
  ];
  for (let i = outcomes.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [outcomes[i], outcomes[j]] = [outcomes[j] as "win" | "loss", outcomes[i] as "win" | "loss"];
  }
  const base = Date.parse("2026-11-15T20:00:00.000Z");
  return outcomes.map((outcome, i) => {
    const hero = heroById(r.pick(CORVID_HEROES))!;
    const win = outcome === "win";
    const duration = r.int(1500, 2700);
    return {
      matchId: String(123456789 - i),
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

export const corvidMatches = buildCorvidMatches();

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
export function matchDetail(summary: MatchSummary): MatchDetail {
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
    steamId: CORVID_STEAM_ID,
    displayName: "Corvid",
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
