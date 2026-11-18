import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { useDebounced } from "@/lib/useDebounced";
import { usePlayerSearch } from "./hooks";

const wrapper = (qc: QueryClient) =>
  function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

const empty = {
  items: [],
  meta: {
    fetchedAt: "2026-11-18T00:00:00Z",
    sourceUpdatedAt: null,
    isStale: false,
    isPartial: false,
  },
};

describe("recherche de joueurs : couche de données", () => {
  it("une rafale de frappes ne produit qu'une requête (debounce), la précédente est annulée", async () => {
    const seen: { q: string; aborted: boolean }[] = [];
    server.use(
      http.get("*/players/search", async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q") ?? "";
        await delay(150);
        seen.push({ q, aborted: request.signal.aborted });
        return HttpResponse.json(empty);
      }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(({ q }) => usePlayerSearch(useDebounced(q, 60)), {
      initialProps: { q: "" },
      wrapper: wrapper(qc),
    });
    for (const q of ["co", "cor", "corv", "corvi", "corvid"]) {
      act(() => rerender({ q }));
      await new Promise((r) => setTimeout(r, 15));
    }
    await waitFor(() => expect(result.current.data).toBeDefined(), { timeout: 10_000 });
    // Seule la dernière valeur stabilisée est demandée.
    expect(seen.filter((s) => !s.aborted).map((s) => s.q)).toEqual(["corvid"]);
  });

  it("changer de terme pendant une requête l'annule", async () => {
    const seen: { q: string; aborted: boolean }[] = [];
    server.use(
      http.get("*/players/search", async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q") ?? "";
        await delay(200);
        seen.push({ q, aborted: request.signal.aborted });
        return HttpResponse.json(empty);
      }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(({ q }) => usePlayerSearch(q), {
      initialProps: { q: "ab" },
      wrapper: wrapper(qc),
    });
    await new Promise((r) => setTimeout(r, 40));
    act(() => rerender({ q: "abc" }));
    await waitFor(() => expect(result.current.data).toBeDefined(), { timeout: 10_000 });
    await new Promise((r) => setTimeout(r, 300));
    expect(seen.find((s) => s.q === "ab")?.aborted ?? true).toBe(true);
    expect(seen.find((s) => s.q === "abc")?.aborted).toBe(false);
  });

  it("deux consommateurs du même terme (casse différente) partagent une requête", async () => {
    let n = 0;
    server.use(
      http.get("*/players/search", () => {
        n++;
        return HttpResponse.json(empty);
      }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(
      () => ({ a: usePlayerSearch("Corvid"), b: usePlayerSearch("corvid ") }),
      {
        wrapper: wrapper(qc),
      },
    );
    await waitFor(() => expect(result.current.a.data && result.current.b.data).toBeTruthy(), {
      timeout: 10_000,
    });
    expect(n).toBe(1);
  });
});
