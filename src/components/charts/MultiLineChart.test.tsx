import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MultiLineChart, type Series } from "./MultiLineChart";

const series: Series[] = [
  {
    key: "a",
    label: "Alpha",
    color: "#b4abff",
    points: [
      { at: Date.parse("2026-11-01"), value: 50 },
      { at: Date.parse("2026-11-11"), value: 52 },
      { at: Date.parse("2026-11-21"), value: 55 },
    ],
  },
  {
    key: "b",
    label: "Bravo",
    color: "#3dd68c",
    points: [
      { at: Date.parse("2026-11-01"), value: 48 },
      { at: Date.parse("2026-11-21"), value: 49 },
    ],
  },
];

describe("MultiLineChart : accès sans souris", () => {
  it("se focalise au clavier et annonce d'abord comment le parcourir", async () => {
    render(<MultiLineChart series={series} title="Progression" format={(v) => `R${v}`} />);
    const chart = screen.getByRole("img", { name: "Progression" });
    expect(chart).toHaveAttribute("tabindex", "0");
    expect(screen.getByText(/Flèches gauche et droite/)).toBeInTheDocument();
    await userEvent.tab();
    expect(chart).toHaveFocus();
    // Au focus, le curseur se place sur la date la plus récente et annonce la valeur de chaque série.
    const live = document.querySelector("[aria-live='polite']") as HTMLElement;
    expect(live).toHaveTextContent(/Alpha R55/);
    expect(live).toHaveTextContent(/Bravo R49/);
  });

  it("les flèches déplacent le curseur, Début et Fin vont aux extrémités, Échap l'efface", async () => {
    render(<MultiLineChart series={series} title="Progression" format={(v) => `R${v}`} />);
    await userEvent.tab();
    const live = document.querySelector("[aria-live='polite']") as HTMLElement;
    await userEvent.keyboard("{Home}");
    expect(live).toHaveTextContent(/Alpha R50/);
    expect(live).toHaveTextContent(/Bravo R48/);
    await userEvent.keyboard("{ArrowRight}");
    const afterOne = live.textContent;
    await userEvent.keyboard("{End}");
    expect(live).toHaveTextContent(/Alpha R55/);
    expect(live.textContent).not.toBe(afterOne);
    await userEvent.keyboard("{Escape}");
    expect(live).toHaveTextContent(/Flèches gauche et droite/);
  });

  it("perdre le focus efface le curseur", async () => {
    render(<MultiLineChart series={series} title="Progression" />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByText(/Flèches gauche et droite/)).toBeInTheDocument();
  });
});

describe("MultiLineChart : segments et repères", () => {
  const t = (d: string) => Date.parse(d);
  const split: Series[] = [
    {
      key: "a",
      label: "Alpha",
      color: "#b4abff",
      points: [
        { at: t("2026-11-01"), value: 66, segment: 1 },
        { at: t("2026-11-03"), value: 68, segment: 1 },
        { at: t("2026-11-08"), value: 50, segment: 2 },
        { at: t("2026-11-12"), value: 52, segment: 2 },
        { at: t("2026-11-14"), value: 54, segment: 3 },
      ],
    },
  ];

  it("ne relie jamais deux segments : un « M » par segment, un point isolé reste visible", () => {
    const { container } = render(
      <MultiLineChart
        series={split}
        title="Rang"
        markers={[{ at: t("2026-11-05"), label: "Saison 2" }]}
      />,
    );
    const d = container.querySelector("path[stroke='#b4abff']")!.getAttribute("d") ?? "";
    expect(d.match(/M/g)).toHaveLength(3);
    expect(d.match(/L/g)).toHaveLength(2); // 1 trait par segment de 2 points, aucun entre segments
    expect(container.querySelectorAll("circle")).toHaveLength(1); // le segment d'un seul point
    expect(screen.getByText("Saison 2")).toBeInTheDocument();
  });

  it("sans segment : une courbe continue, comme avant", () => {
    const { container } = render(<MultiLineChart series={series} title="P" />);
    const d = container.querySelector("path[stroke='#b4abff']")!.getAttribute("d") ?? "";
    expect(d.match(/M/g)).toHaveLength(1);
  });

  it("un repère hors de la plage affichée n'est pas tracé", () => {
    render(
      <MultiLineChart
        series={split}
        title="R"
        markers={[{ at: t("2027-01-01"), label: "Futur" }]}
      />,
    );
    expect(screen.queryByText("Futur")).toBeNull();
  });
});
