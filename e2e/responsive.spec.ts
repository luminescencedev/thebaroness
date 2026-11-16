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
  await page.goto("/search");
  await page.getByLabel("Pseudo ou identifiant Steam").focus();
  const outline = await page
    .getByLabel("Pseudo ou identifiant Steam")
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe("solid");
});
