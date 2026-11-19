import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

const T = { timeout: 10_000 };
const meta = {
  fetchedAt: "2026-11-18T09:42:00.000Z",
  sourceUpdatedAt: null,
  isStale: false,
  isPartial: false,
};
const pt = (at: string, score: number, season: number | null) => ({
  at,
  matchId: at,
  badge: score,
  tier: Math.floor((score - 1) / 6),
  subrank: score - Math.floor((score - 1) / 6) * 6,
  score,
  name: "Rang",
  imageUrl: null,
  outcome: "win",
  season,
});
const seasons = [
  {
    season: 1,
    name: "Beta Season 1",
    startedAt: "2026-07-30T17:00:00.000Z",
    endedAt: "2026-11-05T20:00:00.000Z",
  },
  { season: 2, name: "Beta Season 2", startedAt: "2026-11-05T20:00:00.000Z", endedAt: null },
];
const stub = (points: ReturnType<typeof pt>[]) =>
  server.use(
    http.get("*/players/:id/rank-history", () =>
      HttpResponse.json({
        period: "30d",
        seasons,
        points,
        coverage: {
          requestedFrom: null,
          requestedTo: "2026-11-16T12:00:00.000Z",
          rankedMatches: points.length,
          pointCount: points.length,
          missingBadge: 0,
          isPartial: false,
          notes: [],
        },
        meta,
      }),
    ),
  );

describe("profil : courbe de rang et saisons classées", () => {
  it("deux saisons : la courbe est coupée et le dit, sans relier les rangs", async () => {
    stub([
      pt("2026-11-01T10:00:00.000Z", 66, 1),
      pt("2026-11-03T10:00:00.000Z", 68, 1),
      pt("2026-11-08T10:00:00.000Z", 50, 2),
      pt("2026-11-12T10:00:00.000Z", 52, 2),
    ]);
    renderApp(`/players/${SCENARIOS.steamIdFull}?period=30d`);
    expect(
      await screen.findByText(/Changement de saison classée le/, undefined, T),
    ).toBeInTheDocument();
    expect(screen.getByText(/deux saisons ne sont pas comparables/)).toBeInTheDocument();
  });

  it("une seule saison : aucune coupure, aucune note", async () => {
    stub([pt("2026-11-08T10:00:00.000Z", 50, 2), pt("2026-11-12T10:00:00.000Z", 52, 2)]);
    renderApp(`/players/${SCENARIOS.steamIdFull}?period=30d`);
    await screen.findByText(/Progression du rang classé/, undefined, T);
    await screen.findByText(/parties classées avec badge connu/, undefined, T);
    expect(screen.queryByText(/Changement de saison classée/)).toBeNull();
  });

  it("saisons indisponibles (season null) : courbe continue, pas de fausse coupure", async () => {
    stub([pt("2026-11-01T10:00:00.000Z", 66, null), pt("2026-11-12T10:00:00.000Z", 52, null)]);
    renderApp(`/players/${SCENARIOS.steamIdFull}?period=30d`);
    await screen.findByText(/parties classées avec badge connu/, undefined, T);
    expect(screen.queryByText(/Changement de saison classée/)).toBeNull();
  });
});
