import { describe, expect, it } from "vitest";
import { crumbsFor } from "./navModel";

describe("fil d'Ariane", () => {
  it("ne répète jamais le parent : un titre encore celui de la liste donne un libellé neutre", () => {
    const c = crumbsFor("/tracked/6afec0a793520cf55784dde3", "Mes suivis");
    expect(c.map((x) => x.label)).toEqual(["Mes suivis", "Détail"]);
    expect(crumbsFor("/groups/abc", "Groupes").map((x) => x.label)).toEqual(["Groupes", "Détail"]);
  });
  it("utilise le titre de la page de détail dès qu'il est publié", () => {
    expect(crumbsFor("/tracked/abc", "Top 1 Europe").map((x) => x.label)).toEqual([
      "Mes suivis",
      "Top 1 Europe",
    ]);
    expect(crumbsFor("/heroes/6", "Abrams").map((x) => x.label)).toEqual(["Héros", "Abrams"]);
  });
  it("pages de premier niveau : aucune pastille", () => {
    expect(crumbsFor("/heroes")).toEqual([]);
    expect(crumbsFor("/items")).toEqual([]);
  });
});
