import { act, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sessionStore } from "@/api/session";
import { renderApp } from "@/test/render";

describe("layout", () => {
  it("affiche wordmark, liens, déclencheur de recherche et pied de page", () => {
    renderApp("/");

    expect(screen.getAllByLabelText("The Baroness, accueil").length).toBeGreaterThan(0);
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    for (const label of ["Joueurs", "Héros", "Classement"]) {
      expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Rechercher un joueur" })).toHaveTextContent("⌘K");
    expect(screen.getByRole("link", { name: "Connexion" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Créer un compte" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.getByText(/Deadlock API, projet communautaire indépendant de Valve/),
    ).toBeInTheDocument();
    expect(document.title).toBe("Accueil · The Baroness");
  });

  it("affiche l'email de l'utilisateur connecté à la place des liens d'accès", () => {
    sessionStore.set({ token: "t", user: { id: "1", email: "alice@example.test" } });
    renderApp("/");

    expect(screen.getByText("alice@example.test")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Connexion" })).not.toBeInTheDocument();
  });

  it("réagit à une déconnexion", () => {
    sessionStore.set({ token: "t", user: { id: "1", email: "alice@example.test" } });
    renderApp("/");
    act(() => sessionStore.clear());

    expect(screen.getByRole("link", { name: "Connexion" })).toBeInTheDocument();
  });

  it("affiche la page introuvable pour une route inconnue", () => {
    renderApp("/nimporte-quoi");
    expect(screen.getByRole("heading", { name: "Page introuvable" })).toBeInTheDocument();
  });
});
