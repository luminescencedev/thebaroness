import { describe, expect, it } from "vitest";
import { decodeRankScore, rankScore, scoreLabel } from "./rank";

describe("score de rang (tier * 6 + sous-rang)", () => {
  it("encode et décode sans perte sur toute la plage 1 à 72", () => {
    for (let tier = 0; tier <= 11; tier++)
      for (let sub = 1; sub <= 6; sub++) {
        expect(decodeRankScore(rankScore(tier, sub))).toEqual({ tier, subrank: sub });
      }
    expect(rankScore(11, 6)).toBe(72);
  });
  it("nomme le score avec le catalogue, ou « Rang N » si le tier est inconnu", () => {
    const ranks = [{ tier: 2, name: "Oracle" }] as never;
    expect(scoreLabel(rankScore(2, 3), ranks)).toBe("Oracle 3");
    expect(scoreLabel(rankScore(5, 1), ranks)).toBe("Rang 5 1");
    expect(scoreLabel(rankScore(2, 3), undefined)).toBe("Rang 2 3");
  });
});
