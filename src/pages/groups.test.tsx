import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { sessionStore } from "@/api/session";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";
import { signIn } from "@/test/session";

const meta = {
  fetchedAt: "2026-11-18T09:42:00.000Z",
  sourceUpdatedAt: null,
  isStale: false,
  isPartial: false,
};
const GID = "607f1f77bcf86cd799439021";
const A = "76561198000000010";
const B = "76561198000000011";

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
  ...o,
});

function stubCompare(
  members: ReturnType<typeof member>[],
  extra: Record<string, unknown> = {},
  ids = [A, B],
) {
  const periods: string[] = [];
  server.use(
    http.get("*/groups/:id/compare", ({ request }) => {
      periods.push(new URL(request.url).searchParams.get("period") ?? "");
      return HttpResponse.json({
        group: {
          id: GID,
          name: "Les amis",
          steamIds: ids,
          createdAt: meta.fetchedAt,
          updatedAt: meta.fetchedAt,
        },
        period: "30d",
        members,
        highlights: [],
        meta,
        ...extra,
      });
    }),
  );
  return periods;
}

beforeEach(() => {
  sessionStore.clear();
  signIn();
});

describe("liste des groupes", () => {
  it("lignes de groupe : nombre de joueurs, lien, aucun appel de statistiques", async () => {
    const calls: string[] = [];
    server.events.on(
      "request:start",
      ({ request }) => void calls.push(new URL(request.url).pathname),
    );
    renderApp("/groups");
    const list = await screen.findByRole("list", { name: "Vos groupes" }, { timeout: 10_000 });
    const link = within(list).getAllByRole("link")[0] as HTMLElement;
    expect(link).toHaveAttribute("href", expect.stringMatching(/^\/groups\/[0-9a-f]{24}$/));
    expect(within(link).getByText(/\d+ joueurs/)).toBeInTheDocument();
    expect(calls.some((p) => p.endsWith("/compare"))).toBe(false);
    server.events.removeAllListeners();
  });

  it("aucun groupe : état vide avec action", async () => {
    server.use(http.get("*/groups", () => HttpResponse.json({ items: [] })));
    renderApp("/groups");
    expect(await screen.findByText("Aucun groupe", {}, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nouveau groupe" })).toBeInTheDocument();
  });

  it("filtre par nom à partir de 8 groupes seulement", async () => {
    const group = (i: number) => ({
      id: String(i).padStart(24, "a"),
      name: i === 3 ? "Les anciens" : `Groupe ${i}`,
      steamIds: [A, B],
      createdAt: meta.fetchedAt,
      updatedAt: meta.fetchedAt,
    });
    server.use(
      http.get("*/groups", () =>
        HttpResponse.json({ items: Array.from({ length: 12 }, (_, i) => group(i + 1)) }),
      ),
    );
    renderApp("/groups");
    const box = await screen.findByRole(
      "searchbox",
      { name: "Filtrer les groupes" },
      { timeout: 10_000 },
    );
    await userEvent.type(box, "ancien");
    const list = screen.getByRole("list", { name: "Vos groupes" });
    expect(within(list).getAllByRole("link")).toHaveLength(1);
    await userEvent.clear(box);
    await userEvent.type(box, "zzz");
    expect(screen.getByText(/Aucun groupe de ce nom/)).toBeInTheDocument();
  });

  it("erreur de chargement avec réessai", async () => {
    server.use(
      http.get("*/groups", () =>
        HttpResponse.json({ error: { code: "UPSTREAM_ERROR", message: "x" } }, { status: 502 }),
      ),
    );
    renderApp("/groups");
    expect(
      await screen.findByText("Groupes indisponibles", {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });
});

describe("création et édition", () => {
  it("validation : nom vide et moins de 2 joueurs, saisie conservée", async () => {
    renderApp("/groups");
    await userEvent.click(
      await screen.findByRole("button", { name: "Nouveau groupe" }, { timeout: 10_000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Créer le groupe" }));
    expect(within(dialog).getByText(/Le nom doit contenir 1 à 60 caractères/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Choisissez au moins 2 joueurs/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Nom du groupe")).toHaveAttribute("maxlength", "60");
  });

  it("crée un groupe avec 2 SteamID64 puis ouvre la comparaison ; ignore un doublon", async () => {
    const posted: unknown[] = [];
    server.use(
      http.post("*/groups", async ({ request }) => {
        const body = await request.json();
        posted.push(body);
        return HttpResponse.json(
          {
            id: GID,
            name: "Duo",
            steamIds: (body as { steamIds: string[] }).steamIds,
            createdAt: meta.fetchedAt,
            updatedAt: meta.fetchedAt,
          },
          { status: 201 },
        );
      }),
    );
    stubCompare([member(A, "Alpha"), member(B, "Bravo")]);
    const { router } = renderApp("/groups");
    await userEvent.click(
      await screen.findByRole("button", { name: "Nouveau groupe" }, { timeout: 10_000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Nom du groupe"), "Duo");
    const search = within(dialog).getByLabelText("Ajouter un joueur");
    await userEvent.type(search, `${A}{Enter}`);
    await userEvent.type(search, `${A}{Enter}`);
    expect(within(dialog).getByRole("status")).toHaveTextContent(/déjà dans le groupe/);
    expect(search).toHaveValue("");
    expect(within(dialog).getByText(/1 sur 20/)).toBeInTheDocument();
    await userEvent.type(search, `${B}{Enter}`);
    expect(within(dialog).getByText(/2 sur 20/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Créer le groupe" }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/groups/${GID}`));
    expect(posted).toEqual([{ name: "Duo", steamIds: [A, B] }]);
  });

  it("erreur du back à la création : message affiché, saisie conservée", async () => {
    server.use(
      http.post("*/groups", () =>
        HttpResponse.json(
          { error: { code: "INVALID_INPUT", message: "steamIds : doublons interdits" } },
          { status: 400 },
        ),
      ),
    );
    renderApp("/groups");
    await userEvent.click(
      await screen.findByRole("button", { name: "Nouveau groupe" }, { timeout: 10_000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Nom du groupe"), "Duo");
    const search = within(dialog).getByLabelText("Ajouter un joueur");
    await userEvent.type(search, `${A}{Enter}`);
    await userEvent.type(search, `${B}{Enter}`);
    await userEvent.click(within(dialog).getByRole("button", { name: "Créer le groupe" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /doublons interdits|Requête invalide|invalide/i,
    );
    expect(within(dialog).getByLabelText("Nom du groupe")).toHaveValue("Duo");
    expect(within(dialog).getByText(/2 sur 20/)).toBeInTheDocument();
  });

  it("recherche par pseudo : homonymes signalés, joueur déjà ajouté désactivé", async () => {
    server.use(
      http.get("*/players/search", () =>
        HttpResponse.json({
          items: [
            { steamId: A, accountId: 1, displayName: "Zephyr", avatarUrl: null },
            { steamId: B, accountId: 2, displayName: "zephyr", avatarUrl: null },
            {
              steamId: "76561198000000012",
              accountId: 3,
              displayName: "Zephyr20",
              avatarUrl: null,
            },
          ],
          meta,
        }),
      ),
    );
    renderApp("/groups");
    await userEvent.click(
      await screen.findByRole("button", { name: "Nouveau groupe" }, { timeout: 10_000 }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Ajouter un joueur"), "zephyr");
    const results = await within(dialog).findByRole(
      "list",
      { name: "Résultats de recherche" },
      { timeout: 5000 },
    );
    await waitFor(() => expect(within(results).getAllByText("même pseudo")).toHaveLength(2));
    await userEvent.click(within(results).getAllByRole("button")[0] as HTMLElement);
    // Le premier est maintenant sélectionné : la recherche est vidée, on relance pour voir « Déjà dans le groupe ».
    await userEvent.type(within(dialog).getByLabelText("Ajouter un joueur"), "zephyr");
    const again = await within(dialog).findByRole("list", { name: "Résultats de recherche" });
    await waitFor(() => expect(within(again).getByText("Déjà dans le groupe")).toBeInTheDocument());
  });
});

describe("comparaison d'un groupe", () => {
  it("tri : les ex æquo partagent la position, l'inconnu n'a pas de position", async () => {
    stubCompare([
      member(A, "Alpha", { wins: 9, currentRankScore: 60 }),
      member(B, "Bravo", { wins: 9, currentRankScore: null }),
    ]);
    renderApp(`/groups/${GID}`);
    await screen.findByRole("heading", { name: "Les amis" }, { timeout: 10_000 });
    await userEvent.click(screen.getByRole("button", { name: "Victoires" }));
    const list = screen.getByRole("list", { name: /Classement du groupe, trié par victoires/ });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByTitle("Ex æquo")).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByTitle("Ex æquo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Rang" }));
    const byRank = within(screen.getByRole("list", { name: /trié par rang/ })).getAllByRole(
      "listitem",
    );
    expect(within(byRank[1] as HTMLElement).getByText("Position inconnue")).toBeInTheDocument();
  });

  it("échantillon faible, rang et progression inconnus : n/d, jamais 0", async () => {
    stubCompare([
      member(A, "Alpha", {
        matches: 3,
        wins: 3,
        losses: 0,
        winRate: 100,
        kda: 4,
        kdaSampleSize: 3,
      }),
      member(B, "Bravo", {
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: null,
        kda: null,
        kdaSampleSize: 0,
      }),
    ]);
    renderApp(`/groups/${GID}`);
    await screen.findByRole("heading", { name: "Les amis" }, { timeout: 10_000 });
    expect(screen.getAllByText(/échantillon faible/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rang n/d").length).toBeGreaterThan(0);
    expect(screen.getAllByText("n/d").length).toBeGreaterThan(0);
  });

  it("membre indisponible nommé, comparaison partielle annoncée", async () => {
    stubCompare([member(A, "Alpha")], { meta: { ...meta, isPartial: true } }, [
      A,
      "76561198000000099",
    ]);
    renderApp(`/groups/${GID}`);
    expect(
      await screen.findByText(/pas pu être chargé/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/76561198000000099/)).toBeInTheDocument();
  });

  it("faits marquants (ex æquo, seuil) et meilleures parties avec lien vers la partie", async () => {
    stubCompare(
      [
        member(A, "Alpha", {
          bestMatch: {
            matchId: "111",
            playedAt: meta.fetchedAt,
            heroName: "Haze",
            heroImageUrl: null,
            kills: 10,
            deaths: 2,
            assists: 8,
            netWorth: null,
            kda: 9,
          },
        }),
        member(B, "Bravo"),
      ],
      {
        highlights: [
          {
            key: "most_wins",
            steamIds: [A, B],
            value: 6,
            matchId: null,
            eligibleMembers: 2,
            minMatches: 0,
          },
          {
            key: "best_win_rate",
            steamIds: [],
            value: null,
            matchId: null,
            eligibleMembers: 0,
            minMatches: 5,
          },
          {
            key: "best_match",
            steamIds: [A],
            value: 9,
            matchId: "111",
            eligibleMembers: 1,
            minMatches: 0,
          },
        ],
      },
    );
    renderApp(`/groups/${GID}`);
    const facts = await screen.findByRole(
      "heading",
      { name: "Faits marquants" },
      { timeout: 10_000 },
    );
    const list = facts.closest("section") as HTMLElement;
    expect(within(list).getByText("ex æquo")).toBeInTheDocument();
    expect(within(list).queryByText("Meilleur taux de victoire")).toBeNull();
    const parties = screen
      .getByRole("heading", { name: "Meilleures parties" })
      .closest("section") as HTMLElement;
    expect(within(parties).getByRole("link", { name: /Alpha/ })).toHaveAttribute(
      "href",
      "/matches/111",
    );
  });

  it("progression : joueurs sans courbe nommés, aucune fausse courbe", async () => {
    const hist = [
      { at: "2026-11-01T10:00:00.000Z", score: 50 },
      { at: "2026-11-10T10:00:00.000Z", score: 52 },
    ];
    stubCompare([
      member(A, "Alpha", { rankHistory: hist }),
      member(B, "Bravo", { rankHistory: [] }),
    ]);
    renderApp(`/groups/${GID}`);
    expect(
      await screen.findByText(/Sans courbe.*Bravo/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
  });

  it("changer de période relance la comparaison avec la bonne période", async () => {
    const periods = stubCompare([member(A, "Alpha"), member(B, "Bravo")]);
    renderApp(`/groups/${GID}`);
    await screen.findByRole("heading", { name: "Les amis" }, { timeout: 10_000 });
    await userEvent.click(screen.getByRole("radio", { name: "7 jours" }));
    await waitFor(() => expect(periods).toContain("7d"));
  });

  it("groupe introuvable, quota atteint", async () => {
    server.use(
      http.get("*/groups/:id/compare", () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "x" } }, { status: 404 }),
      ),
    );
    const first = renderApp(`/groups/${GID}`);
    expect(
      await screen.findByText("Groupe introuvable", {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
    first.unmount();
    server.use(
      http.get("*/groups/:id/compare", () =>
        HttpResponse.json({ error: { code: "RATE_LIMITED", message: "x" } }, { status: 429 }),
      ),
    );
    renderApp(`/groups/${GID}`);
    expect(
      await screen.findByText(/Trop de requêtes/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
  });

  it("suppression : confirmation, puis retour à la liste ; erreur affichée dans la boîte", async () => {
    stubCompare([member(A, "Alpha"), member(B, "Bravo")]);
    server.use(
      http.delete("*/groups/:id", () =>
        HttpResponse.json(
          { error: { code: "SERVICE_UNAVAILABLE", message: "x" } },
          { status: 503 },
        ),
      ),
    );
    const { router } = renderApp(`/groups/${GID}`);
    await screen.findByRole("heading", { name: "Les amis" }, { timeout: 10_000 });
    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Supprimer le groupe" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Supprimer" }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    server.use(http.delete("*/groups/:id", () => new HttpResponse(null, { status: 204 })));
    await userEvent.click(within(dialog).getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/groups"));
  });
});
