import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { playerKeys } from "@/features/players/hooks";
import { useItemCatalog, useUpgradeCatalog } from "./hooks";

const wrapper = (qc: QueryClient) =>
  function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

describe("catalogue d'objets : une clé, une requête", () => {
  const stops: (() => void)[] = [];
  afterEach(() => stops.splice(0).forEach((s) => s()));

  it("la vue indexée et le catalogue brut partagent la même requête réseau", async () => {
    const calls: string[] = [];
    const listener = ({ request }: { request: Request }) => {
      const u = new URL(request.url);
      if (u.pathname.endsWith("/items")) calls.push(u.search);
    };
    server.events.on("request:start", listener);
    stops.push(() => server.events.removeListener("request:start", listener));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => ({ map: useItemCatalog(), raw: useUpgradeCatalog() }), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.map.data).toBeDefined(), { timeout: 10_000 });
    expect(result.current.raw.data?.items.length).toBe(result.current.map.data?.size);
    expect(calls).toEqual(["?type=upgrade"]);
  });

  it("enabled=false : aucune requête tant que la première ligne n'est pas dépliée", async () => {
    let n = 0;
    const listener = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname.endsWith("/items")) n++;
    };
    server.events.on("request:start", listener);
    stops.push(() => server.events.removeListener("request:start", listener));
    const qc = new QueryClient();
    const { result, rerender } = renderHook(({ on }) => useItemCatalog(on), {
      initialProps: { on: false },
      wrapper: wrapper(qc),
    });
    await new Promise((r) => setTimeout(r, 200));
    expect(n).toBe(0);
    rerender({ on: true });
    await waitFor(() => expect(result.current.data).toBeDefined(), { timeout: 10_000 });
    expect(n).toBe(1);
  });
});

describe("clé de recherche de joueurs", () => {
  it("normalise la casse et les espaces : palette, page et formulaire partagent le cache", () => {
    const k = playerKeys.search("corvid");
    expect(playerKeys.search("Corvid")).toEqual(k);
    expect(playerKeys.search("  CORVID ")).toEqual(k);
    expect(playerKeys.search("corvid jr")).not.toEqual(k);
  });
});
