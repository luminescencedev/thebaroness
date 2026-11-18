import { vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/mocks/scenarios";
import { syntheticMatches } from "@/mocks/synthetic";
import { renderApp } from "@/test/render";

const id = syntheticMatches[SCENARIOS.steamIdFull]![0]!.matchId;

describe("page partie", () => {
  it("affiche les équipes côte à côte, le résultat et le total des éliminations", async () => {
    renderApp(`/matches/${id}`);
    expect(
      await screen.findByRole("region", { name: "Scoreboard Hidden King" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Scoreboard Archmother" })).toBeInTheDocument();
    expect(screen.queryByText(/Amber Hand|Sapphire Flame/)).toBeNull();
    expect(screen.getByText("Souls de l'équipe")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Sélectionner / })).toHaveLength(12);
  });

  it("sélectionne un joueur, garde la sélection au changement de tri, change d'onglet", async () => {
    renderApp(`/matches/${id}`);
    const rows = await screen.findAllByRole("button", { name: /^Sélectionner / });
    const target = rows[3] as HTMLElement;
    await userEvent.click(target);
    expect(target).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("radio", { name: "KDA" }));
    const again = screen.getByRole("button", { name: target.getAttribute("aria-label") as string });
    expect(again).toHaveAttribute("aria-pressed", "true");

    const detail = screen.getByRole("region", { name: "Détail du joueur sélectionné" });
    expect(within(detail).getByText("Comparaison avec la partie")).toBeInTheDocument();
    await userEvent.click(within(detail).getByRole("tab", { name: /Build/ }));
    expect(await within(detail).findByText("Chronologie des achats")).toBeInTheDocument();
  });

  it("copie l'identifiant de la partie", async () => {
    renderApp(`/matches/${id}`);
    const btn = await screen.findByRole("button", { name: "Copier l'identifiant de la partie" });
    const spy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: spy } });
    await userEvent.click(btn);
    expect(spy).toHaveBeenCalledWith(id);
    expect(await screen.findByText("Identifiant copié")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("sidebar : replie et rouvre depuis un bouton global, préférence mémorisée", async () => {
    localStorage.removeItem("baroness:sidebar-collapsed");
    renderApp(`/matches/${id}`);
    const side = await screen.findByLabelText("Barre latérale");
    const panel = document.querySelector(".app-panel") as HTMLElement;
    expect(panel).not.toHaveAttribute("data-expanded");
    await userEvent.click(within(side).getByRole("button", { name: "Masquer la barre latérale" }));
    expect(panel).toHaveAttribute("data-expanded");
    expect(side).toHaveAttribute("inert");
    expect(localStorage.getItem("baroness:sidebar-collapsed")).toBe("1");
    await userEvent.click(screen.getByRole("button", { name: "Afficher la barre latérale" }));
    expect(panel).not.toHaveAttribute("data-expanded");
    expect(side).not.toHaveAttribute("inert");
    expect(localStorage.getItem("baroness:sidebar-collapsed")).toBe("0");
  });

  it("retour : revient à la page précédente", async () => {
    const { router } = renderApp(`/players/${SCENARIOS.steamIdFull}`);
    await screen.findByRole("heading", { name: "Corvid", level: 1 }, { timeout: 10_000 });
    await router.navigate(`/matches/${id}`);
    await screen.findByRole("region", { name: "Scoreboard Hidden King" }, { timeout: 10_000 });
    await userEvent.click(screen.getByRole("button", { name: "Retour à la page précédente" }));
    await waitFor(
      () => expect(router.state.location.pathname).toBe(`/players/${SCENARIOS.steamIdFull}`),
      { timeout: 10_000 },
    );
  });
});
