import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sessionStore } from "@/api/session";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";
import { signIn } from "@/test/session";

const T = { timeout: 10_000 };
const meta = {
  fetchedAt: "2026-11-18T09:42:00.000Z",
  sourceUpdatedAt: null,
  isStale: false,
  isPartial: false,
};
const GID = "607f1f77bcf86cd799439021";
const A = "76561198000000010";
const B = "76561198000000011";
const C = "76561198000000012";

const member = (steamId: string, displayName: string, o: Record<string, unknown> = {}) => ({
  steamId,
  displayName,
  avatarUrl: null,
  rank: null,
  matches: 12,
  wins: 6,
  losses: 6,
  winRate: 50,
  kda: 2,
  kdaSampleSize: 12,
  longestWinStreak: 2,
  bestMatch: null,
  rankHistory: [],
  currentRankScore: null,
  rankDelta: null,
  excludedUnknownModeMatches: 0,
  previous: null,
  deltaVsPrevious: null,
  ...o,
});

interface Seen {
  url: URL;
}
function stubCompare(
  members: ReturnType<typeof member>[],
  extra: Record<string, unknown> | ((url: URL) => Record<string, unknown>) = {},
  ids = [A, B],
) {
  const seen: Seen[] = [];
  server.use(
    http.get("*/groups/:id/compare", ({ request }) => {
      const url = new URL(request.url);
      seen.push({ url });
      const q = url.searchParams;
      const e = typeof extra === "function" ? extra(url) : extra;
      return HttpResponse.json({
        group: {
          id: GID,
          name: "Les amis",
          steamIds: ids,
          createdAt: meta.fetchedAt,
          updatedAt: meta.fetchedAt,
        },
        period: q.get("period") ?? "30d",
        appliedFilters: {
          period: q.get("period") ?? "30d",
          gameMode: q.get("gameMode") ?? "all",
          matchMode: q.get("matchMode") ?? "all",
        },
        members,
        unavailable: [],
        highlights: [],
        methodology: {
          periodFrom: "2026-10-19T00:00:00.000Z",
          rankScore: "tier * 6 + subrank",
          kda: "k",
          highlightMinMatches: 5,
          ties: "t",
          rankDeltaScope: "latest_season_in_period",
          seasons: [],
          seasonBoundariesKnown: true,
          previousPeriod: { from: "2026-09-19T00:00:00.000Z", to: "2026-10-19T00:00:00.000Z" },
        },
        meta,
        ...e,
      });
    }),
  );
  return seen;
}

beforeEach(() => {
  sessionStore.clear();
  signIn();
  // Aucun suivi par défaut : les alias de la fixture masqueraient les pseudos du back.
  server.use(http.get("*/tracked-players", () => HttpResponse.json({ items: [] })));
});
afterEach(() => server.events.removeAllListeners());

describe("liste des groupes : identités des membres (include=members)", () => {
  const group = (id: string, steamIds: string[]) => ({
    id,
    name: `Groupe ${id.slice(-2)}`,
    steamIds,
    createdAt: meta.fetchedAt,
    updatedAt: meta.fetchedAt,
  });

  it("une seule requête pour toute la liste, aucune par membre, avatars et noms affichés", async () => {
    const paths: string[] = [];
    server.events.on("request:start", ({ request }) => {
      const u = new URL(request.url);
      if (u.pathname.startsWith("/api/")) paths.push(u.pathname + u.search);
    });
    server.use(
      http.get("*/groups", ({ request }) => {
        expect(new URL(request.url).searchParams.get("include")).toBe("members");
        return HttpResponse.json({
          items: [
            {
              ...group("aaaaaaaaaaaaaaaaaaaaaa01", [
                A,
                B,
                C,
                "76561198000000013",
                "76561198000000014",
              ]),
              members: [
                { steamId: A, displayName: "Alpha", avatarUrl: "https://x/a.jpg", resolved: true },
                { steamId: B, displayName: "Bravo", avatarUrl: null, resolved: true },
                { steamId: C, displayName: C, avatarUrl: null, resolved: false },
                {
                  steamId: "76561198000000013",
                  displayName: "Delta",
                  avatarUrl: null,
                  resolved: true,
                },
                {
                  steamId: "76561198000000014",
                  displayName: "Echo",
                  avatarUrl: null,
                  resolved: true,
                },
              ],
            },
          ],
          membersCoverage: { requested: 5, resolved: 4, fetched: 4, providerFailed: false },
          meta,
        });
      }),
    );
    renderApp("/groups");
    const list = await screen.findByRole("list", { name: "Vos groupes" }, T);
    // 3 premiers membres, dont une identité non résolue : jamais le SteamID brut en guise de pseudo.
    await waitFor(() => expect(list.textContent).toMatch(/Alpha, Bravo, Joueur 0012 et 2 autres/));
    expect(within(list).queryByText(new RegExp(C))).toBeNull();
    expect(paths.filter((p) => p.includes("/players/"))).toEqual([]);
    expect(paths.filter((p) => p.startsWith("/api/groups?"))).toHaveLength(1);
  });

  it("l'alias de vos suivis passe avant le pseudo du back", async () => {
    server.use(
      http.get("*/groups", () =>
        HttpResponse.json({
          items: [
            {
              ...group("aaaaaaaaaaaaaaaaaaaaaa02", [A, B]),
              members: [
                { steamId: A, displayName: "PseudoSteam", avatarUrl: null, resolved: true },
                { steamId: B, displayName: "Bravo", avatarUrl: null, resolved: true },
              ],
            },
          ],
          meta,
        }),
      ),
      http.get("*/tracked-players", () =>
        HttpResponse.json({
          items: [
            {
              id: "t1",
              steamId: A,
              alias: "Mon pote",
              note: "",
              tags: [],
              createdAt: meta.fetchedAt,
              updatedAt: meta.fetchedAt,
            },
          ],
        }),
      ),
    );
    renderApp("/groups");
    expect(await screen.findByText(/Mon pote, Bravo/, undefined, T)).toBeInTheDocument();
    expect(screen.queryByText(/PseudoSteam/)).toBeNull();
  });

  it("back plus ancien (sans members) : repli sur le nombre de joueurs", async () => {
    server.use(
      http.get("*/groups", () =>
        HttpResponse.json({ items: [group("aaaaaaaaaaaaaaaaaaaaaa03", [A, B])] }),
      ),
      http.get("*/tracked-players", () => HttpResponse.json({ items: [] })),
    );
    renderApp("/groups");
    expect(await screen.findByText("2 joueurs", undefined, T)).toBeInTheDocument();
  });
});

describe("comparaison : période et modes dans l'URL", () => {
  it("les modes partent au serveur, restent dans l'URL, et le périmètre servi est affiché", async () => {
    const seen = stubCompare([member(A, "Alpha"), member(B, "Bravo")]);
    const { router } = renderApp(`/groups/${GID}?gameMode=normal&matchMode=ranked`);
    await screen.findByRole("heading", { name: "Les amis" }, T);
    expect(seen[0]!.url.searchParams.get("gameMode")).toBe("normal");
    expect(seen[0]!.url.searchParams.get("matchMode")).toBe("ranked");
    expect(screen.getAllByText(/30 derniers jours · Normal · Classée/).length).toBeGreaterThan(0);
    // Texte de la méthode : plus de « modes confondus » quand un mode est choisi.
    await userEvent.click(screen.getByText("Méthode et limites"));
    expect(screen.queryByText(/modes de jeu sont confondus/)).toBeNull();
    // Changer le type relance la requête avec la clé complète et met à jour l'URL.
    await userEvent.selectOptions(screen.getByLabelText("Type de partie"), "unranked");
    await waitFor(() => expect(router.state.location.search).toContain("matchMode=unranked"));
    await waitFor(() =>
      expect(seen.some((s) => s.url.searchParams.get("matchMode") === "unranked")).toBe(true),
    );
  });

  it("sélection par défaut : « modes confondus » et aucune clé de filtre dans l'URL", async () => {
    stubCompare([member(A, "Alpha"), member(B, "Bravo")]);
    const { router } = renderApp(`/groups/${GID}`);
    await screen.findByRole("heading", { name: "Les amis" }, T);
    await userEvent.click(screen.getByText("Méthode et limites"));
    expect(screen.getByText(/modes de jeu sont confondus/)).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
  });

  it("parties au mode inconnu écartées : annoncé", async () => {
    stubCompare([member(A, "Alpha", { excludedUnknownModeMatches: 3 }), member(B, "Bravo")]);
    renderApp(`/groups/${GID}?matchMode=ranked`);
    await screen.findByRole("heading", { name: "Les amis" }, T);
    await userEvent.click(screen.getByText("Méthode et limites"));
    expect(screen.getByText(/3 parties au mode inconnu écartées/)).toBeInTheDocument();
  });
});

describe("membres indisponibles nommés (unavailable)", () => {
  it("raison en clair pour chaque membre, sans détail technique", async () => {
    stubCompare([member(A, "Alpha")], {
      meta: { ...meta, isPartial: true },
      unavailable: [
        { steamId: B, reason: "not_found" },
        { steamId: C, reason: "rate_limited" },
        { steamId: "76561198000000013", reason: "provider_error" },
        { steamId: "76561198000000014", reason: "unknown" },
      ],
    });
    renderApp(`/groups/${GID}`);
    await screen.findByText(/pas pu être chargé/, undefined, T);
    expect(screen.getByText(/profil introuvable/)).toBeInTheDocument();
    expect(screen.getByText(/réessayez dans un instant/)).toBeInTheDocument();
    expect(screen.getAllByText(/données indisponibles/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/rate_limited|provider_error|timeout/)).toBeNull();
  });
});

describe("période précédente (deltaVsPrevious)", () => {
  it("écart du back affiché tel quel ; null donne n/d ; rien en « saison »", async () => {
    stubCompare([
      member(A, "Alpha", {
        deltaVsPrevious: { matches: 2, winRate: 4.5, kda: -0.3 },
        previous: {
          from: "x",
          to: "y",
          matches: 10,
          wins: 5,
          winRate: 50,
          kda: 2.3,
          kdaSampleSize: 10,
        },
      }),
      member(B, "Bravo", {
        deltaVsPrevious: { matches: -4, winRate: null, kda: null },
        previous: {
          from: "x",
          to: "y",
          matches: 3,
          wins: 1,
          winRate: 33,
          kda: 1,
          kdaSampleSize: 3,
        },
      }),
    ]);
    const a = renderApp(`/groups/${GID}`);
    await screen.findByRole("heading", { name: "Les amis" }, T);
    expect((await screen.findAllByText(/\+4,5 pts/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/−0,30/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("n/d").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/face à la période précédente/).length).toBeGreaterThan(0);
    a.unmount();

    stubCompare([member(A, "Alpha"), member(B, "Bravo")], { methodology: undefined });
    renderApp(`/groups/${GID}?period=season`);
    await screen.findByRole("heading", { name: "Les amis" }, T);
    expect(screen.queryByText(/face à la période précédente/)).toBeNull();
  });
});

describe("saisons classées : la courbe n'est jamais reliée d'une saison à l'autre", () => {
  const seasons = [
    {
      season: 1,
      name: "Beta Season 1",
      startedAt: "2026-07-30T17:00:00.000Z",
      endedAt: "2026-11-05T20:00:00.000Z",
    },
    { season: 2, name: "Beta Season 2", startedAt: "2026-11-05T20:00:00.000Z", endedAt: null },
  ];
  const hist = [
    { at: "2026-10-30T10:00:00.000Z", score: 66, badge: 1, season: 1 },
    { at: "2026-11-02T10:00:00.000Z", score: 68, badge: 1, season: 1 },
    { at: "2026-11-08T10:00:00.000Z", score: 50, badge: 1, season: 2 },
    { at: "2026-11-12T10:00:00.000Z", score: 52, badge: 1, season: 2 },
  ];

  it("un segment par saison, repère et explication, progression de la dernière saison seulement", async () => {
    stubCompare(
      [
        member(A, "Alpha", { rankHistory: hist, rankDelta: 2 }),
        member(B, "Bravo", { rankHistory: [] }),
      ],
      {
        methodology: {
          periodFrom: "2026-10-19T00:00:00.000Z",
          rankScore: "s",
          kda: "k",
          highlightMinMatches: 5,
          ties: "t",
          rankDeltaScope: "latest_season_in_period",
          seasons,
          seasonBoundariesKnown: true,
          previousPeriod: null,
        },
      },
    );
    renderApp(`/groups/${GID}`);
    const fig = (
      await screen.findByRole("img", { name: /Progression de rang de chaque joueur/ }, T)
    ).closest("figure") as HTMLElement;
    const paths = [...fig.querySelectorAll("path[stroke]")].filter((p) =>
      (p.getAttribute("d") ?? "").startsWith("M"),
    );
    // Une courbe, deux segments : deux « M », aucun trait entre le 02/11 (saison 1) et le 08/11 (saison 2).
    expect(paths).toHaveLength(1);
    expect((paths[0]!.getAttribute("d") ?? "").match(/M/g)).toHaveLength(2);
    expect(screen.getByText(/Changement de saison classée le/)).toBeInTheDocument();
    expect(screen.getAllByText(/Beta Season 2/).length).toBeGreaterThan(0);
  });

  it("saisons indisponibles : courbe continue et avertissement dans la méthode", async () => {
    stubCompare(
      [
        member(A, "Alpha", { rankHistory: hist.map((p) => ({ ...p, season: null })) }),
        member(B, "Bravo"),
      ],
      {
        methodology: {
          periodFrom: null,
          rankScore: "s",
          kda: "k",
          highlightMinMatches: 5,
          ties: "t",
          rankDeltaScope: "latest_season_in_period",
          seasons: [],
          seasonBoundariesKnown: false,
          previousPeriod: null,
        },
      },
    );
    renderApp(`/groups/${GID}`);
    await screen.findByRole("img", { name: /Progression de rang de chaque joueur/ }, T);
    expect(screen.queryByText(/Changement de saison classée/)).toBeNull();
    await userEvent.click(screen.getByText("Méthode et limites"));
    expect(screen.getByText(/saisons classées sont indisponibles/)).toBeInTheDocument();
  });
});

describe("jouer ensemble (include=pairs, avec la comparaison)", () => {
  const pairs = (over: Record<string, unknown> = {}) => ({
    scope: {
      relation: "same_team",
      partyConfirmed: false,
      basis: "match_history_intersection",
      period: "30d",
      gameMode: "all",
      matchMode: "all",
    },
    items: [
      {
        steamIds: [A, B],
        together: {
          matches: 12,
          wins: 8,
          losses: 4,
          winRate: 66.67,
          lastPlayedAt: "2026-11-17T10:00:00.000Z",
        },
        against: { matches: 1, firstWins: 1 },
      },
      {
        steamIds: [A, C],
        together: { matches: 2, wins: 1, losses: 1, winRate: 50, lastPlayedAt: null },
        against: { matches: 0, firstWins: 0 },
      },
    ],
    coverage: {
      membersIncluded: 3,
      membersMissing: [],
      pairsEvaluated: 3,
      pairsWithCommonMatches: 2,
    },
    ...over,
  });
  const members = [member(A, "Alpha"), member(B, "Bravo"), member(C, "Charlie")];

  it("une seule requête de comparaison porte include=pairs : aucune lecture de plus, aucun bouton", async () => {
    const seen = stubCompare(members, () => ({ pairs: pairs() }), [A, B, C]);
    renderApp(`/groups/${GID}`);
    const list = await screen.findByRole("list", { name: "Parties jouées ensemble" }, T);
    expect(seen.length).toBe(1);
    expect(seen[0]!.url.searchParams.get("include")).toBe("pairs");
    expect(
      screen.queryByRole("button", { name: /Afficher les parties jouées ensemble/ }),
    ).toBeNull();
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText(/12 parties · 8 V \/ 4 D/)).toBeInTheDocument();
    // Petit échantillon signalé, adversaires mentionnés, jamais « en escouade ».
    expect(within(list).getByText(/échantillon faible/)).toBeInTheDocument();
    expect(within(list).getByText(/1 partie l'un contre l'autre/)).toBeInTheDocument();
    expect(screen.queryByText(/en escouade/i)).toBeNull();
    expect(screen.getByText(/même équipe/)).toBeInTheDocument();
  });

  it("membre non évalué : « non évalué », jamais « aucune partie »", async () => {
    stubCompare(
      members.slice(0, 2),
      () => ({
        pairs: pairs({
          items: [],
          coverage: {
            membersIncluded: 2,
            membersMissing: [C],
            pairsEvaluated: 1,
            pairsWithCommonMatches: 0,
          },
        }),
      }),
      [A, B, C],
    );
    renderApp(`/groups/${GID}`);
    expect(
      await screen.findByText(/Aucune partie commune observée dans la même équipe/, undefined, T),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Non évalués : ${C}`))).toBeInTheDocument();
    expect(
      screen.getByText(/l'absence d'une paire ne veut rien dire pour eux/),
    ).toBeInTheDocument();
  });

  it("back plus ancien (pas de pairs) : la section le dit, sans faux « aucune partie »", async () => {
    stubCompare(members, () => ({}), [A, B, C]);
    renderApp(`/groups/${GID}`);
    expect(
      await screen.findByText(/ne fournit pas les parties communes/, undefined, T),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Aucune partie commune observée/)).toBeNull();
  });

  it("changement de sélection : la section annonce la sélection servie, pas celle demandée", async () => {
    stubCompare(
      members,
      (u) => ({
        pairs: pairs({
          scope: {
            relation: "same_team",
            partyConfirmed: false,
            basis: "match_history_intersection",
            period: u.searchParams.get("period") ?? "30d",
            gameMode: "all",
            matchMode: "all",
          },
        }),
      }),
      [A, B, C],
    );
    renderApp(`/groups/${GID}?period=7d`);
    const status = await screen.findAllByText(/7 derniers jours/, undefined, T);
    expect(status.length).toBeGreaterThan(0);
  });
});
