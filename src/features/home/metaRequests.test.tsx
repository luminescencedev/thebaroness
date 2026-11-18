import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

const T = { timeout: 10_000 };

describe("accueil : méta des héros groupée (v1.14.0)", () => {
  const stops: (() => void)[] = [];
  afterEach(() => stops.splice(0).forEach((s) => s()));

  const watch = () => {
    const batch: URL[] = [];
    const single: string[] = [];
    const listener = ({ request }: { request: Request }) => {
      const u = new URL(request.url);
      if (u.pathname.endsWith("/heroes/stats")) batch.push(u);
      if (/\/heroes\/\d+\/stats$/.test(u.pathname)) single.push(u.pathname);
    };
    server.events.on("request:start", listener);
    stops.push(() => server.events.removeListener("request:start", listener));
    return { batch, single };
  };

  it("une seule requête groupée, aucune requête de méta par héros", async () => {
    const seen = watch();
    renderApp("/");
    await screen.findByText("Héros et méta", undefined, T);
    await new Promise((r) => setTimeout(r, 600));
    expect(seen.batch).toHaveLength(1);
    expect(seen.single).toEqual([]);
    const ids = (seen.batch[0]!.searchParams.get("heroIds") ?? "").split(",");
    expect(ids.length).toBeGreaterThan(2);
    expect(ids.length).toBeLessThanOrEqual(7);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("méta indisponible : les lignes restent, valeurs n/d, rien d'inventé", async () => {
    server.use(
      http.get("*/heroes/stats", () =>
        HttpResponse.json(
          { error: { code: "SERVICE_UNAVAILABLE", message: "indisponible" } },
          { status: 503 },
        ),
      ),
    );
    renderApp("/");
    const widget = (await screen.findByText("Héros et méta", undefined, T)).closest("article")!;
    await within(widget).findAllByText("n/d", undefined, T);
    expect(within(widget).getAllByRole("link").length).toBeGreaterThan(2);
  });

  it("héros sans donnée dans la fenêtre : n/d, jamais 0 %", async () => {
    server.use(
      http.get("*/heroes/stats", ({ request }) => {
        const ids = (new URL(request.url).searchParams.get("heroIds") ?? "").split(",").map(Number);
        return HttpResponse.json({
          items: ids.map((heroId) => ({
            heroId,
            matches: null,
            winRate: null,
            pickRate: null,
            avgKills: null,
            avgDeaths: null,
            avgAssists: null,
            winRateByTier: [],
          })),
          unknownHeroIds: [],
          scope: { period: "30d", gameMode: "normal", matchMode: "all" },
          coverage: { requested: ids.length, known: ids.length, withStats: 0 },
          meta: {
            fetchedAt: new Date().toISOString(),
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: false,
          },
        });
      }),
    );
    renderApp("/");
    const widget = (await screen.findByText("Héros et méta", undefined, T)).closest("article")!;
    await within(widget).findAllByText("n/d", undefined, T);
    expect(within(widget).queryByText(/^0[,.]?0*\s?%$/)).toBeNull();
  });
});
