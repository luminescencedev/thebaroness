import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SCENARIOS } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

function trendRequests() {
  const urls: URL[] = [];
  const listener = ({ request }: { request: Request }) => {
    const u = new URL(request.url);
    if (u.pathname.endsWith("/trends")) urls.push(u);
  };
  server.events.on("request:start", listener);
  return { urls, stop: () => server.events.removeListener("request:start", listener) };
}

describe("courbe de performance : série du back", () => {
  const spies: { stop: () => void }[] = [];
  afterEach(() => spies.splice(0).forEach((s) => s.stop()));

  it("lit /trends avec la période du scope, trace la série et ne recalcule rien localement", async () => {
    const spy = trendRequests();
    spies.push(spy);
    renderApp(`/players/${SCENARIOS.steamIdFull}?period=7d`);
    await screen.findByText(/Courbe : \d+ dernières? parties?/);
    await waitFor(() => expect(spy.urls.length).toBeGreaterThan(0));
    expect(spy.urls[0]!.searchParams.get("period")).toBe("7d");
    expect(spy.urls[0]!.searchParams.get("size")).toBe("20");

    // Winrate glissant : défini à partir de la 10e partie, les points sans échantillon complet restent vides.
    await userEvent.click(screen.getByRole("radio", { name: "Victoires" }));
    expect(await screen.findByText(/Victoires glissantes \(10 parties\)/)).toBeInTheDocument();

    // Changer la fenêtre relance la série avec la nouvelle taille.
    await userEvent.click(screen.getByRole("radio", { name: "50" }));
    await waitFor(() =>
      expect(spy.urls.some((u) => u.searchParams.get("size") === "50")).toBe(true),
    );
  });
});
