import { describe, expect, it } from "vitest";
import type { PlayerSummary } from "@/api";
import { groupResults, homonymKeys, matchParts, normalizeName, STEAM_ID_RE } from "./model";

const p = (displayName: string, n: number): PlayerSummary => ({
  steamId: `7656119800000000${n}`.slice(0, 17),
  accountId: n,
  displayName,
  avatarUrl: null,
});

describe("recherche : modèle", () => {
  it("normalise la casse et les espaces, pas les chiffres", () => {
    expect(normalizeName("  ZephyrWolf ")).toBe(normalizeName("zephyrwolf"));
    expect(normalizeName("Zephyr  Wolf")).toBe("zephyr wolf");
    expect(normalizeName("ZephyrWolf")).not.toBe(normalizeName("ZephyrWolf20"));
  });

  it("ne regroupe comme homonymes que des pseudos égaux après normalisation", () => {
    const items = [p("ZephyrWolf", 1), p("zephyrwolf", 2), p("ZephyrWolf20", 3), p("Nyx", 4)];
    const g = groupResults(items, "zephyrwolf");
    expect(g.homonyms).toHaveLength(1);
    expect(g.homonyms[0]?.players.map((x) => x.accountId)).toEqual([1, 2]);
    expect(g.homonyms[0]?.exact).toBe(true);
    expect(g.similar.map((x) => x.displayName)).toEqual(["ZephyrWolf20", "Nyx"]);
    expect(g.exact).toEqual([]);
  });

  it("un pseudo identique à la recherche et unique est une correspondance exacte", () => {
    const g = groupResults([p("Corvid", 1), p("Corvid Jr", 2)], "corvid");
    expect(g.exact.map((x) => x.displayName)).toEqual(["Corvid"]);
    expect(g.homonyms).toEqual([]);
    expect(g.similar.map((x) => x.displayName)).toEqual(["Corvid Jr"]);
  });

  it("met d'abord les homonymes qui correspondent à la recherche, ordre du back sinon", () => {
    const items = [p("Aa", 1), p("Aa", 2), p("Bb", 3), p("Bb", 4)];
    expect(groupResults(items, "bb").homonyms.map((h) => h.key)).toEqual(["bb", "aa"]);
  });

  it("signale les pseudos répétés pour la palette", () => {
    expect([...homonymKeys([p("A", 1), p("a", 2), p("B", 3)])]).toEqual(["a"]);
  });

  it("ne reconnaît que 17 chiffres comme SteamID64", () => {
    expect(STEAM_ID_RE.test("76561198000000010")).toBe(true);
    expect(STEAM_ID_RE.test("7656119800000001")).toBe(false);
    expect(STEAM_ID_RE.test("[U:1:39734282]")).toBe(false);
  });

  it("découpe autour de la correspondance, sans décalage", () => {
    expect(matchParts("NoxFox12", "fox")).toEqual({ before: "Nox", match: "Fox", after: "12" });
    expect(matchParts("NoxFox12", "zzz")).toBeNull();
    expect(matchParts("İstanbul", "stan")).toBeNull();
  });
});
