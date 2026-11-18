import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { clearRecents } from "@/features/search/recents";
import { SCENARIOS } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

const meta = {
  fetchedAt: "2026-11-18T09:42:00.000Z",
  sourceUpdatedAt: null,
  isStale: false,
  isPartial: false,
};
const player = (steamId: string, displayName: string, n: number) => ({
  steamId,
  accountId: n,
  displayName,
  avatarUrl: null,
});

function stubSearch(items: ReturnType<typeof player>[], partial = false) {
  const calls: string[] = [];
  server.use(
    http.get("*/players/search", ({ request }) => {
      calls.push(new URL(request.url).searchParams.get("q") ?? "");
      return HttpResponse.json({ items, meta: { ...meta, isPartial: partial } });
    }),
  );
  return calls;
}

describe("page /search", () => {
  beforeEach(() => clearRecents());

  it("a son propre champ, rempli depuis ?q=", async () => {
    stubSearch([]);
    renderApp("/search?q=corvid");
    expect(await screen.findByRole("searchbox", { name: /Pseudo Steam/ })).toHaveValue("corvid");
  });

  it("regroupe de vrais homonymes et laisse les pseudos proches à part", async () => {
    stubSearch([
      player("76561198000000001", "ZephyrWolf", 1),
      player("76561198000000002", "zephyrwolf", 2),
      player("76561198000000003", "ZephyrWolf20", 3),
    ]);
    renderApp("/search?q=zephyrwolf");
    const group = await screen.findByRole("region", { name: /Même pseudo, 2 comptes/ });
    expect(within(group).getAllByRole("link")).toHaveLength(2);
    expect(within(group).getByText(/existe sur 2 comptes Steam/)).toBeInTheDocument();
    const similar = screen.getByRole("heading", { name: "Pseudos proches" });
    expect(similar).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /ZephyrWolf20/ })).toHaveLength(1);
    expect(screen.queryByText(/Plusieurs comptes ont un pseudo proche/)).toBeNull();
  });

  it("n'affiche aucun rang dans les résultats", async () => {
    stubSearch([player("76561198000000001", "Nyx", 1)]);
    renderApp("/search?q=nyx");
    await screen.findByRole("link", { name: /Nyx/ });
    expect(screen.queryByText(/Rang|Oracle|Eternus/)).toBeNull();
  });

  it("la frappe met l'URL à jour après 300 ms, sans empiler l'historique, avec une seule requête", async () => {
    const calls = stubSearch([player("76561198000000001", "Corvid", 1)]);
    const { router } = renderApp("/search");
    const box = await screen.findByRole("searchbox");
    await userEvent.type(box, "corv");
    expect(router.state.location.search).toBe("");
    await waitFor(() => expect(router.state.location.search).toBe("?q=corv"), { timeout: 3000 });
    await screen.findByRole("link", { name: /Corvid/ });
    expect(calls).toEqual(["corv"]);
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("un seul caractère ne lance aucune requête", async () => {
    const calls = stubSearch([]);
    renderApp("/search");
    await userEvent.type(await screen.findByRole("searchbox"), "c");
    await new Promise((r) => setTimeout(r, 450));
    expect(calls).toEqual([]);
    expect(screen.getByText(/2 caractères minimum/)).toBeInTheDocument();
  });

  it("Entrée valide tout de suite", async () => {
    const calls = stubSearch([]);
    const { router } = renderApp("/search");
    await userEvent.type(await screen.findByRole("searchbox"), "nyx{Enter}");
    expect(router.state.location.search).toBe("?q=nyx");
    await waitFor(() => expect(calls).toEqual(["nyx"]));
  });

  it("un SteamID64 ouvre le profil directement, sans appel de recherche", async () => {
    const calls = stubSearch([]);
    const { router } = renderApp("/search");
    await userEvent.type(await screen.findByRole("searchbox"), "76561198000000042{Enter}");
    await waitFor(() => expect(router.state.location.pathname).toBe("/players/76561198000000042"));
    expect(calls).toEqual([]);
  });

  it("un résultat ouvert alimente les récents, affichés quand le champ est vide", async () => {
    stubSearch([player("76561198000000001", "Corvid", 1)]);
    const first = renderApp("/search?q=corvid");
    await userEvent.click(await screen.findByRole("link", { name: /Corvid/ }));
    first.unmount();
    renderApp("/search");
    const recents = await screen.findByRole("region", { name: "Récents" });
    expect(within(recents).getByRole("link", { name: /Corvid/ })).toHaveAttribute(
      "href",
      "/players/76561198000000001",
    );
  });

  it("zéro résultat, quota atteint et service indisponible", async () => {
    const empty = renderApp(`/search?q=${SCENARIOS.searchEmpty}`);
    expect(await screen.findByText(/Aucun joueur pour/)).toBeInTheDocument();
    empty.unmount();
    const limited = renderApp(`/search?q=${SCENARIOS.searchRateLimited}`);
    expect(await screen.findByText(/Trop de requêtes/)).toBeInTheDocument();
    limited.unmount();
    renderApp(`/search?q=${SCENARIOS.searchUnavailable}`);
    expect(await screen.findByText(/temporairement indisponibles/)).toBeInTheDocument();
  });

  it("signale des résultats partiels", async () => {
    stubSearch([player("76561198000000001", "Nyx", 1)], true);
    renderApp("/search?q=nyx");
    expect(await screen.findByText(/Résultats partiels/)).toBeInTheDocument();
  });

  it("la navigation arrière ramène la requête précédente dans le champ", async () => {
    stubSearch([]);
    const { router } = renderApp("/search?q=aaa");
    const box = await screen.findByRole("searchbox");
    await userEvent.type(box, "{Control>}a{/Control}{Delete}bbb{Enter}");
    await waitFor(() => expect(router.state.location.search).toBe("?q=bbb"));
    await router.navigate("/search?q=ccc");
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveValue("ccc"));
  });
});
