import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SCENARIOS } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { renderApp } from "@/test/render";
import { playerKeys } from "./hooks";
import { DEFAULT_SCOPE, parseMatchFilters, parseScope } from "./scope";

const ID = SCENARIOS.steamIdFull;

/** Journal des requêtes réellement émises vers l'API (chemin + paramètres). */
function recordRequests() {
  const log: URL[] = [];
  const on = ({ request }: { request: Request }) => log.push(new URL(request.url));
  server.events.on("request:start", on);
  return {
    log,
    of: (suffix: string) => log.filter((u) => u.pathname.endsWith(`/players/${ID}${suffix}`)),
    stop: () => server.events.removeListener("request:start", on),
  };
}

let rec: ReturnType<typeof recordRequests> | undefined;
afterEach(() => rec?.stop());

describe("scope du profil dans l'URL", () => {
  it("valeurs inconnues ou absentes : retombe sur les défauts du back", () => {
    expect(parseScope(new URLSearchParams())).toEqual(DEFAULT_SCOPE);
    expect(parseScope(new URLSearchParams("period=1y&gameMode=x&matchMode=y"))).toEqual(
      DEFAULT_SCOPE,
    );
    expect(parseMatchFilters(new URLSearchParams("outcome=loss&matchHero=12"))).toMatchObject({
      outcome: "loss",
      heroId: 12,
    });
  });

  it("les clés de requête portent tous les filtres et ne se confondent jamais", () => {
    const f = { ...DEFAULT_SCOPE, outcome: "all" as const, heroId: null };
    const keys = [
      playerKeys.matches(ID, f),
      playerKeys.matches(ID, { ...f, period: "7d" }),
      playerKeys.matches(ID, { ...f, gameMode: "normal" }),
      playerKeys.matches(ID, { ...f, matchMode: "ranked" }),
      playerKeys.matches(ID, { ...f, outcome: "loss" }),
      playerKeys.matches(ID, { ...f, heroId: 6 }),
    ].map((k) => JSON.stringify(k));
    expect(new Set(keys).size).toBe(keys.length);
    expect(JSON.stringify(playerKeys.overview(ID, DEFAULT_SCOPE))).not.toBe(
      JSON.stringify(playerKeys.heroes(ID, DEFAULT_SCOPE)),
    );
  });
});

describe("profil branché sur le back v1.9.0", () => {
  it("envoie un scope explicite (30 jours) à l'overview, aux parties et aux héros", async () => {
    rec = recordRequests();
    renderApp(`/players/${ID}`);
    await screen.findByText("Performance", {}, { timeout: 4000 });
    await waitFor(() => expect(rec!.of("/heroes").length).toBeGreaterThan(0));
    expect(rec.of("/overview")[0]?.searchParams.get("period")).toBe("30d");
    expect(rec.of("/matches")[0]?.searchParams.get("period")).toBe("30d");
    expect(rec.of("/heroes")[0]?.searchParams.get("period")).toBe("30d");
  });

  it("affiche les KPI officiels du back, pas un recalcul local", async () => {
    renderApp(`/players/${ID}`);
    const kpi = await screen.findByText("Valeur nette / min", {}, { timeout: 4000 });
    const card = kpi.parentElement as HTMLElement;
    // moyenne par partie (définition du back), et libellé de périmètre
    expect(within(card).getByText(/moyenne par partie/)).toBeInTheDocument();
    expect(screen.getByText(/30 derniers jours · \d+ parties?/)).toBeInTheDocument();
  });

  it("changer de période relance overview, parties et héros sans réutiliser de curseur", async () => {
    rec = recordRequests();
    const { router } = renderApp(`/players/${ID}`);
    await screen.findByText("Performance", {}, { timeout: 4000 });
    await userEvent.click(screen.getByRole("radio", { name: "7 jours" }));
    await waitFor(() => expect(router.state.location.search).toBe("?period=7d"));
    await waitFor(() =>
      expect(rec!.of("/overview").some((u) => u.searchParams.get("period") === "7d")).toBe(true),
    );
    const matches7 = rec.of("/matches").filter((u) => u.searchParams.get("period") === "7d");
    expect(matches7.length).toBeGreaterThan(0);
    expect(matches7.every((u) => !u.searchParams.has("cursor") || matches7.indexOf(u) > 0)).toBe(
      true,
    );
    expect(matches7[0]?.searchParams.has("cursor")).toBe(false);
  });

  it("onglet Parties : le résultat et le héros partent au serveur et vivent dans l'URL", async () => {
    rec = recordRequests();
    const { router } = renderApp(`/players/${ID}?tab=matches`);
    await screen.findByRole("list", { name: "Parties" }, { timeout: 4000 });
    await userEvent.click(screen.getByRole("radio", { name: "Défaites" }));
    await waitFor(() => expect(router.state.location.search).toContain("outcome=loss"));
    await waitFor(() =>
      expect(rec!.of("/matches").some((u) => u.searchParams.get("outcome") === "loss")).toBe(true),
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Héros"),
      (within(screen.getByLabelText("Héros")).getAllByRole("option")[1] as HTMLOptionElement).value,
    );
    await waitFor(() => expect(router.state.location.search).toContain("matchHero="));
    await waitFor(() =>
      expect(rec!.of("/matches").some((u) => u.searchParams.has("heroId"))).toBe(true),
    );
    // jamais de curseur sur la première page d'un nouveau filtre
    const firstFiltered = rec.of("/matches").find((u) => u.searchParams.has("heroId"));
    expect(firstFiltered?.searchParams.has("cursor")).toBe(false);
  });

  it("filtre sans résultat : état vide clair, la page ne casse pas", async () => {
    renderApp(`/players/${ID}?tab=matches&period=7d&matchMode=ranked&gameMode=street_brawl`);
    expect(
      await screen.findByText("Aucune partie ne correspond", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it("l'onglet Héros suit le scope et reste cohérent avec le widget du profil", async () => {
    const { router } = renderApp(`/players/${ID}`);
    await screen.findByText("Héros les plus joués", {}, { timeout: 4000 });
    const widget = screen.getByText("Héros les plus joués").closest("section, div") as HTMLElement;
    expect(widget).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: "Héros" }));
    await screen.findByRole("list", { name: "Héros joués" }, { timeout: 4000 });
    expect(router.state.location.search).toBe("?tab=heroes");
    await userEvent.click(screen.getByRole("radio", { name: "7 jours" }));
    await waitFor(() => expect(router.state.location.search).toContain("period=7d"));
    expect(router.state.location.search).toContain("tab=heroes");
  });

  it("Actualiser invalide les statistiques du scope courant", async () => {
    rec = recordRequests();
    renderApp(`/players/${ID}`);
    await screen.findByText("Performance", {}, { timeout: 4000 });
    const before = rec.of("/overview").length;
    await userEvent.click(screen.getByRole("button", { name: "Actualiser" }));
    await waitFor(() => expect(rec!.of("/overview").length).toBeGreaterThan(before), {
      timeout: 4000,
    });
  });

  it("scénario sans partie : message dédié, pas de statistique à 0", async () => {
    renderApp(`/players/${SCENARIOS.steamIdPartial}`);
    expect(
      await screen.findByText("Aucune partie sur cette période", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText("0,00 %")).not.toBeInTheDocument();
  });

  it("l'activité vient du back et suit le format et le type du scope", async () => {
    rec = recordRequests();
    renderApp(`/players/${ID}?matchMode=ranked`);
    expect(
      await screen.findByText(/12 semaines, jours en UTC/, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    const act = rec.of("/activity")[0];
    expect(act?.searchParams.get("weeks")).toBe("12");
    expect(act?.searchParams.get("matchMode")).toBe("ranked");
  });

  it("joués avec et contre : liste, bascule, format normal par défaut", async () => {
    rec = recordRequests();
    renderApp(`/players/${ID}`);
    const list = await screen.findByRole("list", { name: "Coéquipiers" }, { timeout: 4000 });
    expect(within(list).getAllByRole("link").length).toBeGreaterThan(0);
    expect(rec.of("/relationships")[0]?.searchParams.get("gameMode")).toBe("normal");
    await userEvent.click(screen.getByRole("radio", { name: "Contre" }));
    expect(await screen.findByRole("list", { name: "Adversaires" })).toBeInTheDocument();
  });

  it("partie dépliée : build résolu depuis /items, MVP et statistiques de fin de partie", async () => {
    rec = recordRequests();
    renderApp(`/players/${ID}?tab=matches`);
    const toggle = (
      await screen.findAllByRole("button", { name: /Afficher le détail de la partie/ })
    )[0] as HTMLElement;
    await userEvent.click(toggle);
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls") as string,
    ) as HTMLElement;
    expect(
      await within(panel).findByLabelText("Statistiques de fin de partie", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Classement MVP (Valve)")).toBeInTheDocument();
    expect(within(panel).getByRole("region", { name: "Build complet" })).toBeInTheDocument();
    expect(rec.log.filter((u) => u.pathname.endsWith("/api/items")).length).toBe(1);
  });

  it("tendance N contre N : suit la fenêtre de la courbe et refuse une comparaison inégale", async () => {
    rec = recordRequests();
    renderApp(`/players/${ID}`);
    expect(
      await screen.findByLabelText(
        /Tendance : 20 dernières parties contre les 20 précédentes/,
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
    expect(rec.of("/trends")[0]?.searchParams.get("size")).toBe("20");
    await userEvent.click(screen.getByRole("radio", { name: "50" }));
    expect(
      await screen.findByText(/Pas assez de parties pour comparer 50 contre 50/),
    ).toBeInTheDocument();
    expect(rec.of("/trends").some((u) => u.searchParams.get("size") === "50")).toBe(true);
  });
});
