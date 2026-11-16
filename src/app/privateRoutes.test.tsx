import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { signIn } from "@/test/session";
import { renderApp } from "@/test/render";

describe("routes privées", () => {
  it("redirige /tracked vers /login sans session", async () => {
    const { router } = renderApp("/tracked");

    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.queryByRole("heading", { name: "Mes suivis" })).not.toBeInTheDocument();
  });

  it("redirige aussi /tracked/:id", async () => {
    const { router } = renderApp("/tracked/507f1f77bcf86cd799439012");
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });

  it("affiche la page avec une session et le bon titre d'onglet", async () => {
    signIn();
    renderApp("/tracked");

    expect(await screen.findByRole("heading", { name: "Mes suivis" })).toBeInTheDocument();
    expect(document.title).toBe("Mes suivis · The Baroness");
  });
});
