import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";

describe("classement : identités et rangs résolus par le back", () => {
  const stops: (() => void)[] = [];
  afterEach(() => stops.splice(0).forEach((s) => s()));

  it("aucune requête de profil, même pour les entrées sans rang", async () => {
    const calls: string[] = [];
    const listener = ({ request }: { request: Request }) => {
      calls.push(new URL(request.url).pathname);
    };
    server.events.on("request:start", listener);
    stops.push(() => server.events.removeListener("request:start", listener));
    renderApp("/leaderboard");
    await screen.findByRole("list", { name: "Podium" }, { timeout: 4000 });
    await new Promise((r) => setTimeout(r, 400));
    expect(calls.filter((p) => /\/players\/\d+$/.test(p))).toEqual([]);
    expect(calls.filter((p) => p.endsWith("/leaderboard"))).toHaveLength(1);
  });
});
