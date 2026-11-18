import { describe, expect, it } from "vitest";
import type { LeaderboardEntry } from "@/api";
import { isTied, parseRegion, safeColor } from "./model";

const entry = (rank: number): LeaderboardEntry => ({
  rank,
  displayName: `p${rank}`,
  steamId: null,
  badge: null,
  topHeroes: [],
});

describe("classement : modèle", () => {
  it("marque les ex æquo d'après les rangs de la source", () => {
    const items = [1, 2, 2, 4, 5, 5, 5].map(entry);
    expect(items.map((_, i) => isTied(items, i))).toEqual([
      false,
      true,
      true,
      false,
      true,
      true,
      true,
    ]);
  });

  it("lit la région de l'URL, Europe par défaut", () => {
    expect(parseRegion("Asia")).toBe("Asia");
    expect(parseRegion("Mars")).toBe("Europe");
    expect(parseRegion(null)).toBe("Europe");
  });

  it("n'accepte que #RRGGBB comme couleur de rang", () => {
    expect(safeColor("#5CE9A9")).toBe("#5CE9A9");
    expect(safeColor("red; background:url(x)")).toBeNull();
    expect(safeColor(null)).toBeNull();
  });
});
