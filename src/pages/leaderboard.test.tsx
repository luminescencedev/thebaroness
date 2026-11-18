import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

describe("classement : identités et rangs résolus par le back", () => {
  const stops: (() => void)[] = [];
  afterEach(() => stops.splice(0).forEach((s) => s()));

  it("aucune requête de profil, même pour les entrées sans rang", async () => {
    const calls: string[] = [];
    const listener = ({ request }: { request: Request }) => {
      calls.push(new URL(request.url).pathname);
    };
    server.events.on("request:start", listener);
    stops.push(() => server.events.removeListener("request:start", listener));
    renderApp("/leaderboard");
    await screen.findByText(/comptes\s+identifiés/, undefined, { timeout: 10_000 });
    await new Promise((r) => setTimeout(r, 400));
    expect(calls.filter((p) => /\/players\/\d+$/.test(p))).toEqual([]);
    expect(calls.filter((p) => p.endsWith("/leaderboard"))).toHaveLength(1);
  });

  it("ligne cliquable seulement avec un SteamID, pastilles déduit et non relié, ex æquo, rang inconnu", async () => {
    const badge = {
      tier: 11,
      subrank: 6,
      name: "Eternus 6",
      imageUrl: null,
      badgeId: 116,
      color: "#5CE9A9",
    };
    const meta = {
      fetchedAt: "2026-11-18T09:42:00.000Z",
      sourceUpdatedAt: null,
      isStale: false,
      isPartial: false,
    };
    server.use(
      http.get("*/leaderboard", () =>
        HttpResponse.json({
          region: "Asia",
          items: [
            {
              rank: 1,
              displayName: "Alpha",
              steamId: "76561198000000001",
              inferred: false,
              avatarUrl: null,
              badge,
              topHeroes: [],
            },
            {
              rank: 2,
              displayName: "Bravo",
              steamId: "76561198000000002",
              inferred: true,
              avatarUrl: null,
              badge,
              topHeroes: [],
            },
            {
              rank: 2,
              displayName: "Charlie",
              steamId: null,
              inferred: false,
              avatarUrl: null,
              badge: null,
              topHeroes: [],
            },
          ],
          coverage: {
            entries: 3,
            withSteamId: 2,
            inferredSteamId: 1,
            withBadge: 2,
            withAvatar: 0,
            ranksComplete: false,
          },
          meta,
        }),
      ),
    );
    renderApp("/leaderboard?region=Asia");
    const list = await screen.findByRole("list", { name: "Joueurs classés" }, { timeout: 10_000 });
    const rows = within(list).getAllByRole("listitem") as [HTMLElement, HTMLElement, HTMLElement];
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByRole("link", { name: /Alpha/ })).toHaveAttribute(
      "href",
      "/players/76561198000000001",
    );
    expect(within(rows[1]).getByRole("button", { name: /Compte déduit/ })).toBeInTheDocument();
    expect(within(rows[2]).queryByRole("link")).toBeNull();
    expect(within(rows[2]).getByRole("button", { name: /Compte non relié/ })).toBeInTheDocument();
    expect(within(rows[2]).getAllByText("Rang n/d").length).toBeGreaterThan(0);
    expect(within(rows[1]).getByTitle("Ex æquo")).toBeInTheDocument();
    expect(within(rows[2]).getByTitle("Ex æquo")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "P" &&
          /2\s+comptes\s+identifiés sur 3, dont 1 déduits/.test(el.textContent ?? ""),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Asie", selected: true })).toBeInTheDocument();
  });

  it("la région vit dans l'URL, le cache évite de relire une région déjà vue, 429 sans réessai automatique", async () => {
    const calls: string[] = [];
    let limited = true;
    server.use(
      http.get("*/leaderboard", ({ request }) => {
        const region = new URL(request.url).searchParams.get("region") ?? "";
        calls.push(region);
        if (region === "Asia" && limited)
          return HttpResponse.json(
            { error: { code: "RATE_LIMITED", message: "Trop de requêtes." } },
            { status: 429 },
          );
        return HttpResponse.json({
          region,
          items: [
            {
              rank: 1,
              displayName: `Top ${region}`,
              steamId: "76561198000000001",
              inferred: false,
              avatarUrl: null,
              badge: null,
              topHeroes: [],
            },
          ],
          coverage: {
            entries: 1,
            withSteamId: 1,
            inferredSteamId: 0,
            withBadge: 0,
            withAvatar: 0,
            ranksComplete: false,
          },
          meta: {
            fetchedAt: "2026-11-18T09:42:00.000Z",
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: false,
          },
        });
      }),
    );
    const { router } = renderApp("/leaderboard");
    expect(await screen.findByText("Top Europe", {}, { timeout: 10_000 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Asie" }));
    expect(router.state.location.search).toBe("?region=Asia");
    expect(
      await screen.findByText(/Trop de requêtes/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 300));
    expect(calls.filter((c) => c === "Asia")).toHaveLength(1);

    limited = false;
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByText("Top Asia")).toBeInTheDocument();

    // Retour sur Europe : servi par le cache, aucune nouvelle requête.
    await userEvent.click(screen.getByRole("tab", { name: "Europe" }));
    expect(await screen.findByText("Top Europe")).toBeInTheDocument();
    expect(calls.filter((c) => c === "Europe")).toHaveLength(1);
  });

  it("clavier : les flèches déplacent le focus sans lancer de requête, Entrée valide, et la ligne cliquable est un lien focalisable", async () => {
    server.use(
      http.get("*/leaderboard", () =>
        HttpResponse.json({
          region: "Europe",
          items: [
            {
              rank: 1,
              displayName: "Alpha",
              steamId: "76561198000000001",
              inferred: false,
              avatarUrl: null,
              badge: null,
              topHeroes: [],
            },
            {
              rank: 2,
              displayName: "Sans lien",
              steamId: null,
              inferred: false,
              avatarUrl: null,
              badge: null,
              topHeroes: [],
            },
          ],
          meta: {
            fetchedAt: "2026-11-18T09:42:00.000Z",
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: false,
          },
        }),
      ),
    );
    renderApp("/leaderboard");
    const link = await screen.findByRole("link", { name: /Alpha/ }, { timeout: 10_000 });
    // Une ligne sans SteamID n'est pas exposée comme un lien.
    expect(screen.queryByRole("link", { name: /Sans lien/ })).toBeNull();
    link.focus();
    expect(link).toHaveFocus();
    const tab = screen.getByRole("tab", { name: "Europe" });
    tab.focus();
    await userEvent.keyboard("{ArrowRight}");
    // Les flèches déplacent le focus : activer chaque région au passage consommerait le quota du fournisseur.
    expect(screen.getByRole("tab", { name: "Amérique du Nord" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Europe", selected: true })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("tab", { name: "Amérique du Nord", selected: true }),
      ).toBeInTheDocument(),
    );
  });
});
