import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { syntheticCatalog } from "@/mocks/synthetic";
import { BELOW_THRESHOLD_ITEM, NO_BUILDS_HERO, NO_PAIRS_HERO } from "@/mocks/itemsMock";
import { renderApp } from "@/test/render";

const T = { timeout: 4000 };
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
        (c.querySelector("[title]")?.getAttribute("title") ?? "")
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
