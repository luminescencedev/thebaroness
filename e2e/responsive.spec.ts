import { expect, test } from "@playwright/test";

// T-18 / NF-08 : aucun débordement horizontal à 375 px.
const pages = ["/", "/search?q=corvid", "/players/76561198000000000", "/login", "/nimporte-quoi"];

for (const path of pages) {
  test(`pas de défilement horizontal sur ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("le focus clavier est visible sur le champ de recherche", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("Pseudo Steam ou SteamID64");
  await input.focus();
  // Anneau de focus : contour natif ou ombre portée sur le champ ou son conteneur immédiat.
  const visible = await input.evaluate((el) =>
    [el, el.parentElement, el.parentElement?.parentElement].some((n) => {
      if (!n) return false;
      const cs = getComputedStyle(n);
      return cs.outlineStyle === "solid" || cs.boxShadow !== "none";
    }),
  );
  expect(visible).toBe(true);
});
