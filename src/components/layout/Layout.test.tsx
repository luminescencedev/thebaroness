import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sessionStore } from "@/api/session";
import { signIn } from "@/test/session";
import { renderApp } from "@/test/render";

describe("layout", () => {
  it("affiche wordmark, liens, déclencheur de recherche et pied de page", () => {
    renderApp("/");

    expect(screen.getAllByLabelText("The Baroness, accueil").length).toBeGreaterThan(0);
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    expect(within(nav).getByRole("link", { name: "Joueurs" })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Mes suivis" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechercher un joueur" })).toHaveTextContent("⌘K");
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Connexion Steam" })).toHaveAttribute(
      "href",
      "/api/auth/steam",
    );
    expect(
      screen.getByText(/Deadlock API, projet communautaire indépendant de Valve/),
    ).toBeInTheDocument();
    expect(document.title).toBe("Accueil · The Baroness");
  });

  it("affiche l'email et Mes suivis quand l'utilisateur est connecté", () => {
    signIn();
    renderApp("/");

    expect(screen.getByText("Corvid")).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Navigation principale" })).getByRole("link", {
        name: "Mes suivis",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Connexion Steam" })).not.toBeInTheDocument();
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
    expect(await screen.findByPlaceholderText(/Pseudo, identifiant Steam/)).toBeInTheDocument();
  });

  it("affiche la page introuvable pour une route inconnue", () => {
    renderApp("/nimporte-quoi");
    expect(screen.getByRole("heading", { name: "Page introuvable" })).toBeInTheDocument();
  });
});
