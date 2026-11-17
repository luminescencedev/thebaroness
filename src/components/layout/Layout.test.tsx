import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sessionStore } from "@/api/session";
import { signIn } from "@/test/session";
import { renderApp } from "@/test/render";

describe("layout", () => {
  it("landing : header avec marque, titre du hero, recherche et mention légale", async () => {
    renderApp("/");
    expect(
      await screen.findByRole("heading", { level: 1, name: /the baroness/i }),
    ).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    expect(within(nav).getByRole("link", { name: "Joueurs" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "The Baroness, accueil" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(nav).getByRole("link", { name: "Connexion Steam" })).toHaveAttribute(
      "href",
      "/api/auth/steam",
    );
    expect(
      screen.getByRole("searchbox", { name: "Pseudo Steam ou SteamID64" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Deadlock API, projet communautaire indépendant de Valve/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Barre latérale" })).not.toBeInTheDocument();
    expect(document.title).toBe("The Baroness · Deadlock Tracker");
  });

  it("shell : sidebar intégrée avec marque, navigation et déclencheur ⌘K", async () => {
    renderApp("/heroes");
    await screen.findByRole("heading", { level: 1 });

    const side = screen.getByRole("complementary", { name: "Barre latérale" });
    expect(within(side).getByLabelText("The Baroness, accueil")).toBeInTheDocument();
    expect(
      within(within(side).getByRole("navigation", { name: "Explorer" })).getByRole("link", {
        name: "Joueurs",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Mon espace" })).not.toBeInTheDocument();
    expect(within(side).getByRole("button", { name: "Rechercher un joueur" })).toHaveTextContent(
      "⌘K",
    );
    expect(within(side).getByRole("link", { name: "Connexion Steam" })).toBeInTheDocument();
  });

  it("affiche Mon espace dans la sidebar quand l'utilisateur est connecté", async () => {
    signIn();
    renderApp("/heroes");
    await screen.findByRole("heading", { level: 1 });

    expect(screen.getByRole("button", { name: /Compte de Corvid/ })).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Mon espace" })).getByRole("link", {
        name: "Mes suivis",
      }),
    ).toBeInTheDocument();
  });

  it("réagit à une déconnexion", () => {
    signIn();
    renderApp("/");
    act(() => sessionStore.clear());

    expect(screen.getAllByRole("link", { name: "Connexion Steam" }).length).toBeGreaterThan(0);
  });

  it("ouvre la palette avec Ctrl+K", async () => {
    renderApp("/");
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(await screen.findByPlaceholderText(/Chercher un joueur/)).toBeInTheDocument();
  });

  it("affiche la page introuvable pour une route inconnue", async () => {
    renderApp("/nimporte-quoi");
    expect(await screen.findByRole("heading", { name: "Page introuvable" })).toBeInTheDocument();
  });
});
