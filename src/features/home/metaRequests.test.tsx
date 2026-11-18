import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

describe("accueil : lecture de la méta des héros", () => {
  const stops: (() => void)[] = [];
  afterEach(() => stops.splice(0).forEach((s) => s()));

  it("une lecture par héros du widget, jamais deux (base de comparaison pour la future méta groupée)", async () => {
    const seen: string[] = [];
    const listener = ({ request }: { request: Request }) => {
      const m = /\/heroes\/(\d+)\/stats$/.exec(new URL(request.url).pathname);
      if (m) seen.push(m[1]!);
    };
    server.events.on("request:start", listener);
    stops.push(() => server.events.removeListener("request:start", listener));
    renderApp("/");
    await screen.findByText("Héros et méta", undefined, { timeout: 4000 });
    await new Promise((r) => setTimeout(r, 600));
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.length).toBeLessThanOrEqual(7);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
