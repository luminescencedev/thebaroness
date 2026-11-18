import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { syntheticCatalog } from "@/mocks/synthetic";
import { BELOW_THRESHOLD_ITEM, NO_BUILDS_HERO, NO_PAIRS_HERO } from "@/mocks/itemsMock";
import { renderApp } from "@/test/render";
import { formatInt } from "@/lib/format";

const T = { timeout: 4000 };
const souls = (n: number) => `${formatInt(n)} souls`;
const item = syntheticCatalog[3]!;

describe("catalogue des héros", () => {
  it("filtre par rôle dans l'URL et se réinitialise", async () => {
    const { router } = renderApp("/heroes");
    await screen.findByText(/^\d+ héros$/, undefined, T);
    await userEvent.click(screen.getByRole("button", { name: "Mystic" }));
    await waitFor(() => expect(router.state.location.search).toBe("?role=mystic"));
    expect(screen.getByRole("button", { name: "Mystic" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.type(screen.getByRole("searchbox"), "zzzzzz");
    await userEvent.click(await screen.findByRole("button", { name: "Réinitialiser les filtres" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });
});

describe("fiche héros", () => {
  it("garde l'onglet dans l'URL et sélectionne un build", async () => {
    const { router } = renderApp("/heroes/6?tab=builds");
    const list = await screen.findByRole("list", { name: "Builds du héros" }, T);
    const buttons = within(list).getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
    await userEvent.click(buttons[1]!);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(router.state.location.search).toContain("build=");
    // favoris du tri courant, jamais un 0 inventé quand le compteur est null
    await userEvent.click(screen.getByRole("radio", { name: "Mis à jour" }));
    await waitFor(() => expect(router.state.location.search).toContain("sort=updated_at"), T);
    await waitFor(
      () =>
        expect(screen.getAllByText("Favoris non renseignés pour ce tri").length).toBeGreaterThan(0),
      T,
    );
    expect(screen.queryByText(/^0 favoris/)).toBeNull();
  });

  it("builds : héros sans build, état vide", async () => {
    renderApp(`/heroes/${NO_BUILDS_HERO}?tab=builds`);
    expect(await screen.findByText("Aucun build publié", undefined, T)).toBeInTheDocument();
  });

  it("paires : liste et état sans association", async () => {
    const a = renderApp("/heroes/6?tab=stats");
    expect(await screen.findByText("Items achetés ensemble", undefined, T)).toBeInTheDocument();
    expect((await screen.findAllByText(/ parties$/, undefined, T)).length).toBeGreaterThan(0);
    a.unmount();
    renderApp(`/heroes/${NO_PAIRS_HERO}?tab=stats`);
    expect(await screen.findByText("Aucune association connue", undefined, T)).toBeInTheDocument();
  });

  it("changer d'onglet ajoute une entrée d'historique", async () => {
    const { router } = renderApp("/heroes/6");
    await userEvent.click(await screen.findByRole("tab", { name: "Capacités" }, T));
    await waitFor(() => expect(router.state.location.search).toBe("?tab=abilities"));
    await router.navigate(-1);
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });
});

describe("catalogue des items", () => {
  it("filtre par catégorie et trie par achats observés", async () => {
    const { router } = renderApp("/items");
    await screen.findByText(/^\d+ items$/, undefined, T);
    await userEvent.click(screen.getByRole("button", { name: "Esprit" }));
    await waitFor(() => expect(router.state.location.search).toContain("slot=spirit"));
    await userEvent.click(screen.getByRole("radio", { name: "Achats" }));
    await waitFor(() => expect(router.state.location.search).toContain("sort=matches"));
    const cards = await screen.findAllByRole("link", { name: /achats/ }, T);
    const nums = cards.map((c) =>
      Number(
        (c.querySelector('[title$="achat observé"]')?.getAttribute("title") ?? "")
          .replace(/parties.*$/, "")
          .replace(/\D/g, "") || Number.NaN,
      ),
    );
    // les milliers sont séparés par une espace insécable : on ne garde que les chiffres
    expect(nums.every(Number.isFinite)).toBe(true);
    // volume décroissant
    expect([...nums].sort((a, b) => b - a)).toEqual(nums);
  });

  it("n'invente pas de taux de choix et reste utilisable sans statistiques", async () => {
    server.use(
      http.get("*/items/stats", () =>
        HttpResponse.json(
          { error: { code: "SERVICE_UNAVAILABLE", message: "indisponible" } },
          { status: 503 },
        ),
      ),
    );
    renderApp("/items");
    expect(
      await screen.findByText(/Achats observés indisponibles/, undefined, T),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link").some((l) => /Basic Magazine/.test(l.textContent ?? "")),
    ).toBe(true);
    expect(screen.queryByText(/\d\s*% (de choix|de sélection)/i)).toBeNull();
  });
});

describe("fiche item", () => {
  it("affiche les statistiques et suit la période demandée", async () => {
    const { router } = renderApp(`/items/${item.id}`);
    expect(await screen.findByText("Parties avec achat", undefined, T)).toBeInTheDocument();
    expect(screen.getByText(/30 derniers jours, tous types de partie/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "7 jours" }));
    await waitFor(() => expect(router.state.location.search).toBe("?period=7d"));
    expect(
      await screen.findByText(/7 derniers jours, tous types de partie/, undefined, T),
    ).toBeInTheDocument();
  });

  it("sous le seuil de la source : échantillon insuffisant, jamais 0 %", async () => {
    renderApp(`/items/${BELOW_THRESHOLD_ITEM}`);
    expect(await screen.findByText("Échantillon insuffisant", undefined, T)).toBeInTheDocument();
    expect(screen.queryByText(/^0[,.]?0* ?%$/)).toBeNull();
  });

  it("item absent du catalogue", async () => {
    renderApp("/items/1");
    expect(await screen.findByText("Item introuvable", undefined, T)).toBeInTheDocument();
  });

  it("avec un héros : retour à sa fiche et associations de l'item", async () => {
    renderApp(`/items/${item.id}?hero=6`);
    expect(await screen.findByRole("link", { name: /Retour à Abrams/ }, T)).toHaveAttribute(
      "href",
      "/heroes/6?tab=builds",
    );
  });
});

describe("filtre de coût exact (catalogue réel du mock)", () => {
  const costNames = (cards: HTMLElement[]) => cards.map((c) => c.textContent ?? "");

  it("propose uniquement les montants présents, sans tranche arbitraire", async () => {
    renderApp("/items");
    await screen.findByText(/^\d+ items$/, undefined, T);
    const group = screen.getByRole("group", { name: "Coût" });
    const labels = within(group)
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(labels).toEqual([
      "Tous",
      souls(800),
      souls(1600),
      souls(3200),
      souls(6400),
      souls(9999),
    ]);
    expect(screen.queryByText(/≤ 1 000|1 001 à 3 000|> 3 000/)).toBeNull();
  });

  it("un seul contrôle : le tier s'affiche devant chaque prix, sans rangée Tier séparée", async () => {
    renderApp("/items");
    await screen.findByText(/^\d+ items$/, undefined, T);
    expect(screen.queryByRole("group", { name: "Tier" })).toBeNull();
    const chip = screen.getByRole("button", { name: souls(1600) });
    expect(chip.textContent).toMatch(/^II · 1\s600$/);
    expect(screen.getByRole("button", { name: souls(9999) }).textContent).toMatch(/^V · 9\s999$/);
  });

  it("1 600 ne garde que les objets à 1 600 et s'écrit dans l'URL", async () => {
    const { router } = renderApp("/items");
    await screen.findByText(/^\d+ items$/, undefined, T);
    await userEvent.click(screen.getByRole("button", { name: souls(1600) }));
    await waitFor(() => expect(router.state.location.search).toBe("?cost=1600"));
    const list = screen.getAllByRole("link", { name: /Tier/ });
    expect(list.length).toBeGreaterThan(0);
    for (const c of list) expect(c.textContent).toMatch(/1\s?600/);
    // retour à Tous
    await userEvent.click(
      within(screen.getByRole("group", { name: "Coût" })).getByRole("button", { name: "Tous" }),
    );
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("restaure le filtre depuis l'URL et se combine avec catégorie, tier et recherche", async () => {
    const { router } = renderApp("/items?cost=3200&slot=spirit&tier=3&q=comp");
    expect(await screen.findByRole("link", { name: /Composite Sample/ }, T)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: souls(3200) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByRole("link", { name: /Tier/ })).toHaveLength(1);
    expect(router.state.location.search).toContain("cost=3200");
  });

  it("anciennes valeurs low, mid, high : pas d'erreur, filtre retiré, autres filtres conservés", async () => {
    for (const legacy of ["low", "mid", "high"]) {
      const { router, unmount } = renderApp(`/items?slot=spirit&cost=${legacy}&sort=cost`);
      await screen.findByText(/^\d+ items$/, undefined, T);
      await waitFor(() => expect(router.state.location.search).not.toContain("cost="));
      expect(router.state.location.search).toContain("slot=spirit");
      expect(router.state.location.search).toContain("sort=cost");
      expect(
        within(screen.getByRole("group", { name: "Coût" })).getByRole("button", { name: "Tous" }),
      ).toHaveAttribute("aria-pressed", "true");
      unmount();
    }
  });

  it("montant absent du catalogue : ignoré et retiré de l'URL, aucun montant arbitraire sélectionné", async () => {
    const { router } = renderApp("/items?cost=2400&q=basic");
    await screen.findByText(/^\d+ items$/, undefined, T);
    await waitFor(() => expect(router.state.location.search).toBe("?q=basic"));
    expect(screen.getByRole("link", { name: /Basic Magazine/ })).toBeInTheDocument();
  });

  it("montant sans résultat après combinaison : état vide compréhensible", async () => {
    renderApp("/items?cost=800&tier=4");
    expect(await screen.findByText("Aucun item", undefined, T)).toBeInTheDocument();
  });

  it("tri par coût : croissant, décroissant, prix inconnu toujours en dernier", async () => {
    renderApp("/items?sort=cost&shop=all");
    await screen.findByText(/^\d+ items$/, undefined, T);
    const prices = () =>
      screen
        .getAllByRole("link", { name: /Tier|Sans|Arme|Esprit|Vitalité/ })
        .map((c) => c.querySelector('[title="Prix du catalogue en souls"]')?.textContent ?? "");
    const asc = prices();
    expect(asc.at(-1)).toBe("n/d");
    const nums = asc.slice(0, -1).map((p) => Number(p.replace(/\D/g, "")));
    expect([...nums].sort((a, b) => a - b)).toEqual(nums);
    await userEvent.click(screen.getByRole("button", { name: /Ordre croissant/ }));
    const desc = prices();
    expect(desc.at(-1)).toBe("n/d");
    const nd = desc.slice(0, -1).map((p) => Number(p.replace(/\D/g, "")));
    expect([...nd].sort((a, b) => b - a)).toEqual(nd);
  });

  it("changer de critère remet l'ordre par défaut et garde les autres paramètres", async () => {
    const { router } = renderApp("/items?sort=cost&dir=desc&slot=weapon&period=7d");
    await screen.findByText(/^\d+ items$/, undefined, T);
    await userEvent.click(screen.getByRole("radio", { name: "Tier" }));
    await waitFor(() => expect(router.state.location.search).toContain("sort=tier"));
    expect(router.state.location.search).not.toContain("dir=");
    expect(router.state.location.search).toContain("slot=weapon");
    expect(router.state.location.search).toContain("period=7d");
  });

  it("réponse partielle : coûts null ou absents, la page reste utilisable", async () => {
    server.use(
      http.get("*/items", () =>
        HttpResponse.json({
          clientVersion: null,
          items: [
            { ...syntheticCatalog[0], cost: null, tier: null, name: null },
            { ...syntheticCatalog[1], cost: null },
          ],
          meta: {
            fetchedAt: new Date().toISOString(),
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: true,
          },
        }),
      ),
    );
    renderApp("/items");
    await screen.findByText(/^\d+ items$/, undefined, T);
    const group = screen.getByRole("group", { name: "Coût" });
    expect(within(group).getAllByRole("button")).toHaveLength(1); // « Tous » seulement
    expect(screen.getByRole("link", { name: /Objet n°9000000/ })).toBeInTheDocument();
    expect(costNames(screen.getAllByRole("link", { name: /Tier|Objet/ })).join()).toContain("n/d");
  });

  it("nouvelle version du catalogue : les montants proposés suivent les coûts renvoyés", async () => {
    server.use(
      http.get("*/items", () =>
        HttpResponse.json({
          clientVersion: 9999,
          items: [
            { ...syntheticCatalog[0], cost: 900 },
            { ...syntheticCatalog[1], cost: 2400 },
            { ...syntheticCatalog[2], cost: 7200 },
          ],
          meta: {
            fetchedAt: new Date().toISOString(),
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: false,
          },
        }),
      ),
    );
    renderApp("/items");
    await screen.findByText(/^\d+ items$/, undefined, T);
    const labels = within(screen.getByRole("group", { name: "Coût" }))
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(labels).toEqual(["Tous", souls(900), souls(2400), souls(7200)]);
  });
});

describe("cohérence des périodes statistiques", () => {
  it("le catalogue annonce la période réellement servie pendant le chargement d'une autre", async () => {
    const real = new Map<string, number>();
    server.use(
      http.get("*/items/stats", async ({ request }) => {
        const p = new URL(request.url).searchParams.get("period") ?? "30d";
        real.set(p, (real.get(p) ?? 0) + 1);
        if (p === "7d") await new Promise((r) => setTimeout(r, 600));
        return HttpResponse.json({
          filters: {
            period: p,
            heroId: null,
            matchMode: "all",
            gameMode: "normal",
            from: new Date().toISOString(),
          },
          items: [],
          meta: {
            fetchedAt: new Date().toISOString(),
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: false,
          },
        });
      }),
    );
    renderApp("/items");
    expect(
      await screen.findByText(/Achats observés : 30 derniers jours/, undefined, T),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "7 jours" }));
    // pendant le chargement : l'ancien périmètre reste annoncé, avec l'indication d'actualisation
    expect(
      await screen.findByText(/30 derniers jours.*Actualisation en cours/, undefined, T),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Achats observés : 7 derniers jours/)).toBeNull();
    expect(
      await screen.findByText(/Achats observés : 7 derniers jours/, undefined, T),
    ).toBeInTheDocument();
  });

  it("fiche item : changements rapides de filtres, le libellé suit la réponse servie", async () => {
    renderApp(`/items/${item.id}`);
    expect(
      await screen.findByText(/30 derniers jours, tous types de partie/, undefined, T),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "7 jours" }));
    await userEvent.click(screen.getByRole("radio", { name: "Classée" }));
    await userEvent.click(screen.getByRole("radio", { name: "Non classée" }));
    expect(
      await screen.findByText(/7 derniers jours, parties non classées/, undefined, T),
    ).toBeInTheDocument();
    expect(screen.queryByText(/30 derniers jours/)).toBeNull();
  });
});

describe("temps de revente sur la fiche item", () => {
  const stats = (over: Record<string, unknown>) =>
    http.get("*/items/:id/stats", () =>
      HttpResponse.json({
        itemId: item.id,
        filters: {
          period: "30d",
          heroId: null,
          matchMode: "all",
          gameMode: "normal",
          from: new Date().toISOString(),
        },
        stats: {
          itemId: item.id,
          matches: 100,
          wins: 55,
          losses: 45,
          winRate: 55,
          players: 80,
          sold: 10,
          sellRate: 10,
          avgBuyTimeSeconds: 600,
          avgSellTimeSeconds: null,
          ...over,
        },
        notes: [],
        meta: {
          fetchedAt: new Date().toISOString(),
          sourceUpdatedAt: null,
          isStale: false,
          isPartial: false,
        },
      }),
    );

  it.each([
    [{ sold: 0 }, "Jamais revendu"],
    [{ sold: 10 }, "Temps moyen indisponible"],
    [{ sold: null }, "n/d"],
    [{ sold: 10, avgSellTimeSeconds: 754 }, "12:34"],
  ])("%j", async (over, expected) => {
    server.use(stats(over));
    renderApp(`/items/${item.id}`);
    const label = await screen.findByText("Temps moyen de revente", undefined, T);
    expect(within(label.parentElement as HTMLElement).getByText(expected)).toBeInTheDocument();
    if ((over as { sold?: number | null }).sold !== 0)
      expect(screen.queryByText("Aucune revente observée")).toBeNull();
  });
});

describe("prix sur la fiche item", () => {
  it("affiche item.cost et n/d quand il est inconnu, sans le calculer depuis le tier", async () => {
    const priced = syntheticCatalog.find((i) => i.tier === 2 && i.cost === 1600)!;
    const a = renderApp(`/items/${priced.id}`);
    expect(await screen.findByText(/1\s600 souls/, undefined, T)).toBeInTheDocument();
    a.unmount();
    const unpriced = syntheticCatalog.find((i) => i.cost === null)!;
    renderApp(`/items/${unpriced.id}`);
    expect(await screen.findByText("Coût n/d", undefined, T)).toBeInTheDocument();
  });
});
