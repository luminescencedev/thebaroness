import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sessionStore } from "@/api/session";
import { DEMO_ACCOUNT, SCENARIOS } from "@/mocks/scenarios";
import { renderApp } from "@/test/render";

const login = () =>
  sessionStore.set({
    token: "mock.507f1f77bcf86cd799439011.signature",
    user: { id: "507f1f77bcf86cd799439011", email: DEMO_ACCOUNT.email },
  });

describe("recherche et profil", () => {
  it("affiche les résultats puis le profil de Corvid", async () => {
    renderApp("/search?q=corvid");
    const link = await screen.findByRole("link", { name: /^Corvid(?! Jr)/ });
    await userEvent.click(link);

    expect(await screen.findByRole("heading", { name: "Corvid", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Rang : Oracle 4")).toBeInTheDocument();
    expect(screen.getByText("Victoires").nextSibling).toHaveTextContent("24");
    expect(screen.getByText("Défaites").nextSibling).toHaveTextContent("18");
    expect((await screen.findAllByText("Victoire")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Défaite").length).toBeGreaterThan(0);
  });

  it("charge plus de parties avec le curseur", async () => {
    renderApp(`/players/${SCENARIOS.steamIdFull}`);
    // 42 parties, pages de 20 : deux clics pour tout charger.
    await userEvent.click(await screen.findByRole("button", { name: "Charger plus" }));
    await waitFor(() => expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(40));
    await userEvent.click(await screen.findByRole("button", { name: "Charger plus" }));
    await waitFor(() => expect(screen.queryByText("Charger plus")).not.toBeInTheDocument());
  });

  it("gère zéro résultat et service indisponible", async () => {
    const first = renderApp(`/search?q=${SCENARIOS.searchEmpty}`);
    expect(await screen.findByText("Aucun résultat")).toBeInTheDocument();
    first.unmount();
    renderApp(`/search?q=${SCENARIOS.searchUnavailable}`);
    expect(await screen.findByText(/temporairement indisponibles/)).toBeInTheDocument();
  });

  it("signale un profil partiel sans afficher 0", async () => {
    renderApp(`/players/${SCENARIOS.steamIdPartial}`);
    expect(
      await screen.findByText(/Données partielles/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("n/d").length).toBeGreaterThan(3);
    expect(await screen.findByText("Aucune partie disponible")).toBeInTheDocument();
  });

  it("affiche joueur introuvable en 404", async () => {
    renderApp("/players/76561198999999999");
    expect(await screen.findByText("Joueur introuvable")).toBeInTheDocument();
  });
});

describe("authentification", () => {
  it("connecte puis redirige vers Mes suivis", async () => {
    renderApp("/login");
    await userEvent.type(screen.getByLabelText("Email"), DEMO_ACCOUNT.email);
    await userEvent.type(screen.getByLabelText("Mot de passe"), DEMO_ACCOUNT.password);
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("heading", { name: "Mes suivis" })).toBeInTheDocument();
    expect(sessionStore.get()?.user.email).toBe(DEMO_ACCOUNT.email);
  });

  it("affiche une erreur générique sur un mauvais mot de passe", async () => {
    renderApp("/login");
    await userEvent.type(screen.getByLabelText("Email"), DEMO_ACCOUNT.email);
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou mot de passe incorrect.");
  });

  it("valide l'inscription et signale un email déjà utilisé", async () => {
    renderApp("/register");
    await userEvent.type(screen.getByLabelText("Email"), "pasunemail");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "court");
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(screen.getByText("Saisissez une adresse email valide.")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Email"));
    await userEvent.type(screen.getByLabelText("Email"), DEMO_ACCOUNT.email);
    await userEvent.clear(screen.getByLabelText("Mot de passe"));
    await userEvent.type(screen.getByLabelText("Mot de passe"), "MotDePasse123!");
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(await screen.findByText("Cette adresse email est déjà utilisée.")).toBeInTheDocument();
  });
});

describe("suivis (CRUD)", () => {
  it("liste, modifie puis supprime un suivi", async () => {
    login();
    renderApp("/tracked");
    await userEvent.click(await screen.findByRole("link", { name: /Duo régulier/ }));

    expect(await screen.findByRole("heading", { name: "Duo régulier" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Modifier" }));
    const alias = screen.getByLabelText("Alias");
    await userEvent.clear(alias);
    await userEvent.type(alias, "Partenaire");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByRole("heading", { name: "Partenaire" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Supprimer" }));
    expect(await screen.findByText("Aucun joueur suivi")).toBeInTheDocument();
  });

  it("suit un joueur depuis son profil", async () => {
    login();
    renderApp(`/players/${SCENARIOS.steamIdPartial}`);
    await userEvent.click(await screen.findByRole("button", { name: "Suivre" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Alias"), "Petit");
    await userEvent.click(within(dialog).getByRole("button", { name: "Suivre ce joueur" }));
    expect(await screen.findByRole("link", { name: "Voir le suivi" })).toBeInTheDocument();
  });

  it("propose de se connecter pour suivre sans session", async () => {
    renderApp(`/players/${SCENARIOS.steamIdFull}`);
    expect(
      await screen.findByRole("link", { name: "Se connecter pour suivre" }),
    ).toBeInTheDocument();
  });
});
