import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";
import { signIn } from "@/test/session";

const T = { timeout: 10_000 };

function apiCalls() {
  const paths: string[] = [];
  const listener = ({ request }: { request: Request }) => {
    const u = new URL(request.url);
    if (u.pathname.startsWith("/api/")) paths.push(u.pathname.replace("/api", ""));
  };
  server.events.on("request:start", listener);
  return { paths, stop: () => server.events.removeListener("request:start", listener) };
}

describe("Mes suivis : réponse groupée", () => {
  const spies: { stop: () => void }[] = [];
  afterEach(() => spies.splice(0).forEach((s) => s.stop()));

  it("une seule requête d'insights, aucune requête de profil ni d'historique par joueur", async () => {
    const spy = apiCalls();
    spies.push(spy);
    signIn();
    renderApp("/tracked");
    await screen.findByRole("link", { name: /Duo régulier/ }, T);
    await new Promise((r) => setTimeout(r, 400));
    expect(spy.paths.filter((p) => p === "/tracked-players/insights")).toHaveLength(1);
    expect(spy.paths.filter((p) => /^\/players\//.test(p))).toEqual([]);
  });

  it("un suivi indisponible n'empêche pas les autres d'afficher rang et forme", async () => {
    signIn();
    server.use(
      http.get("*/tracked-players/insights", () =>
        HttpResponse.json({
          items: [
            {
              trackedPlayerId: "000000000000000000000001",
              steamId: "76561198000000001",
              alias: "x",
              tags: [],
              status: "unavailable",
              player: null,
              rank: null,
              lastMatchAt: null,
              form: null,
              meta: null,
              error: { code: "SERVICE_UNAVAILABLE", message: "indisponible" },
            },
          ],
          total: 1,
          truncated: false,
          meta: {
            fetchedAt: new Date().toISOString(),
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: true,
          },
        }),
      ),
    );
    renderApp("/tracked");
    // La liste (métadonnées) reste affichée même si l'enrichissement est indisponible.
    expect(await screen.findByRole("link", { name: /Duo régulier/ }, T)).toBeInTheDocument();
    expect((await screen.findAllByText("n/d", undefined, T)).length).toBeGreaterThan(0);
  });

  it("au-delà de 100 suivis, le dit sans bloquer", async () => {
    signIn();
    server.use(
      http.get("*/tracked-players/insights", () =>
        HttpResponse.json({
          items: [],
          total: 101,
          truncated: true,
          meta: {
            fetchedAt: new Date().toISOString(),
            sourceUpdatedAt: null,
            isStale: false,
            isPartial: false,
          },
        }),
      ),
    );
    renderApp("/tracked");
    expect(await screen.findByText(/100 premiers suivis/, undefined, T)).toBeInTheDocument();
  });
});
