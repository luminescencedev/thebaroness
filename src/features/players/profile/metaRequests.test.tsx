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

describe("requêtes de méta du profil", () => {
  const spies: { stop: () => void }[] = [];
  afterEach(() => spies.splice(0).forEach((s) => s.stop()));

  it("l'aperçu ne lit que la méta des 3 héros affichés, l'onglet Héros étend la lecture", async () => {
    const spy = countHeroStats();
    spies.push(spy);
    const { router } = renderApp(`/players/${SCENARIOS.steamIdFull}`);
    await screen.findByRole("heading", { name: "Corvid", level: 1 }, T);
    await waitFor(() => expect(spy.seen.size).toBeGreaterThan(0), T);
    await new Promise((r) => setTimeout(r, 400));
    const overview = spy.seen.size;
    expect(overview).toBeLessThanOrEqual(3);

    await router.navigate(`/players/${SCENARIOS.steamIdFull}?tab=heroes`);
    await waitFor(() => expect(spy.seen.size).toBeGreaterThan(overview), T);
    expect(spy.seen.size).toBeLessThanOrEqual(12);
  });
});
