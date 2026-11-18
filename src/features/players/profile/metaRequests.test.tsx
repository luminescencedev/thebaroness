import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SCENARIOS } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

const T = { timeout: 4000 };

/** Compte les lectures de méta de héros (`GET /heroes/:id/stats`) émises pendant un parcours. */
function countHeroStats() {
  const seen = new Set<string>();
  const listener = ({ request }: { request: Request }) => {
    const m = /\/heroes\/(\d+)\/stats$/.exec(new URL(request.url).pathname);
    if (m) seen.add(m[1]!);
  };
  server.events.on("request:start", listener);
  return { seen, stop: () => server.events.removeListener("request:start", listener) };
}

describe("méta des héros du profil : fournie par /players/:id/heroes", () => {
  const spies: { stop: () => void }[] = [];
  afterEach(() => spies.splice(0).forEach((s) => s.stop()));

  it("aucune lecture de méta par héros, ni dans l'aperçu ni dans l'onglet Héros", async () => {
    const spy = countHeroStats();
    spies.push(spy);
    const { router } = renderApp(`/players/${SCENARIOS.steamIdFull}`);
    await screen.findByRole("heading", { name: "Corvid", level: 1 }, T);
    await new Promise((r) => setTimeout(r, 400));
    expect(spy.seen.size).toBe(0);

    await router.navigate(`/players/${SCENARIOS.steamIdFull}?tab=heroes`);
    await screen.findByRole("list", { name: "Héros joués" }, T);
    expect(spy.seen.size).toBe(0);
  });

  it("l'écart face à la méta vient du back (winRateVsMeta)", async () => {
    renderApp(`/players/${SCENARIOS.steamIdFull}?tab=heroes&period=30d&gameMode=normal`);
    const list = await screen.findByRole("list", { name: "Héros joués" }, T);
    await waitFor(() => expect(list.querySelector("[aria-label*='méta']")).not.toBeNull(), T);
    // Périmètre comparable : aucune mention de périmètre différent.
    expect(screen.queryByText(/périmètre différent du filtre actuel/)).toBeNull();
  });

  it("périmètre différent de la méta : le libellé le dit", async () => {
    renderApp(`/players/${SCENARIOS.steamIdFull}?tab=heroes&period=7d`);
    expect(
      await screen.findByText(/périmètre différent du filtre actuel/, undefined, T),
    ).toBeInTheDocument();
  });
});
