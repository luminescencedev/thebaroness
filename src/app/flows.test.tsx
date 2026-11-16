import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sessionStore } from "@/api/session";
import { DEMO_TOKEN, SCENARIOS } from "@/mocks/scenarios";
import { signIn } from "@/test/session";
import { renderApp } from "@/test/render";

describe("recherche et profil", () => {
  it("affiche les résultats puis le profil de Corvid", async () => {
    renderApp("/search?q=corvid");
    const link = await screen.findByRole("link", { name: /^Corvid(?! Jr)/ });
    await userEvent.click(link);

    expect(await screen.findByRole("heading", { name: "Corvid", level: 1 })).toBeInTheDocument();
    expect((await screen.findAllByText("Oracle 4")).length).toBeGreaterThan(0);
    expect(await screen.findByText(/24 V · 18 D/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Parties" }));
    expect((await screen.findAllByText("Victoire")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Défaite").length).toBeGreaterThan(0);
  });

  it("charge plus de parties avec le curseur", async () => {
    renderApp(`/players/${SCENARIOS.steamIdFull}`);
    await userEvent.click(await screen.findByRole("tab", { name: "Parties" }));
    // 42 parties, pages de 20 : deux clics pour tout charger.
    const more = /Charger \d+ parties de plus/;
    await userEvent.click(await screen.findByRole("button", { name: more }));
    await waitFor(() => expect(screen.getAllByRole("row").length).toBeGreaterThan(30));
    await userEvent.click(await screen.findByRole("button", { name: more }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: more })).not.toBeInTheDocument(),
    );
  });

  it("gère zéro résultat et service indisponible", async () => {
    const first = renderApp(`/search?q=${SCENARIOS.searchEmpty}`);
    expect(await screen.findByText(/Aucun joueur pour/)).toBeInTheDocument();
    first.unmount();
    renderApp(`/search?q=${SCENARIOS.searchUnavailable}`);
    expect(await screen.findByText(/temporairement indisponibles/)).toBeInTheDocument();
  });

  it("signale un profil partiel sans afficher 0", async () => {
    renderApp(`/players/${SCENARIOS.steamIdPartial}`);
    expect(
      await screen.findByText(/Données partielles/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect((await screen.findAllByText("n/d")).length).toBeGreaterThan(1);
    expect(await screen.findByText("Pas assez de parties")).toBeInTheDocument();
  });

  it("affiche joueur introuvable en 404", async () => {
    renderApp("/players/76561198999999999");
    expect(await screen.findByText("Joueur introuvable")).toBeInTheDocument();
  });
});

describe("connexion Steam", () => {
  it("la page de connexion mène au backend (OpenID)", async () => {
    renderApp("/login");
    expect(await screen.findByRole("link", { name: "Se connecter avec Steam" })).toHaveAttribute(
      "href",
      "/api/auth/steam",
    );
  });

  it("ouvre la session depuis le jeton du fragment puis ouvre Mes suivis", async () => {
    window.location.hash = `#token=${DEMO_TOKEN}`;
    renderApp("/auth/callback");

    expect(await screen.findByRole("heading", { name: "Mes suivis" })).toBeInTheDocument();
    expect(sessionStore.get()?.user.displayName).toBe("Corvid");
    window.location.hash = "";
  });

  it("affiche une erreur quand Steam échoue ou que le jeton est refusé", async () => {
    const first = renderApp("/auth/callback?error=steam_failed");
    expect(await screen.findByText("Connexion impossible")).toBeInTheDocument();
    first.unmount();

    window.location.hash = "#token=faux";
    renderApp("/auth/callback");
    expect(await screen.findByText("Connexion impossible")).toBeInTheDocument();
    expect(sessionStore.get()).toBeNull();
    window.location.hash = "";
  });

  it("garde la déconnexion en mémoire seulement", async () => {
    signIn();
    renderApp("/");
    await userEvent.click(screen.getByRole("button", { name: /Compte de Corvid/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Déconnexion" }));
    expect(sessionStore.get()).toBeNull();
  });
});

describe("suivis (CRUD)", () => {
  it("liste, modifie puis supprime un suivi", async () => {
    signIn();
    renderApp("/tracked");
    await userEvent.click(await screen.findByRole("link", { name: /Duo régulier/ }));

    expect(await screen.findByRole("heading", { name: "Duo régulier" })).toBeInTheDocument();
    const alias = screen.getByLabelText("Alias");
    await userEvent.clear(alias);
    await userEvent.type(alias, "Partenaire");
    expect(screen.getByText("Modifications non enregistrées")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByRole("heading", { name: "Partenaire" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Ne plus suivre/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Ne plus suivre" }));
    await screen.findByRole("heading", { name: "Mes suivis" });
    expect(screen.queryByRole("link", { name: /Partenaire/ })).not.toBeInTheDocument();
  });

  it("suit un joueur depuis son profil", async () => {
    signIn();
    renderApp(`/players/${SCENARIOS.steamIdPartial}`);
    await userEvent.click((await screen.findAllByRole("button", { name: /^Suivre/ }))[0]!);
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Alias"), "Petit");
    await userEvent.click(within(dialog).getByRole("button", { name: "Suivre ce joueur" }));
    expect((await screen.findAllByRole("link", { name: "Voir le suivi" })).length).toBeGreaterThan(
      0,
    );
  });

  it("propose de se connecter pour suivre sans session", async () => {
    renderApp(`/players/${SCENARIOS.steamIdFull}`);
    expect(
      (await screen.findAllByRole("link", { name: "Se connecter avec Steam pour suivre" })).length,
    ).toBeGreaterThan(0);
  });
});
