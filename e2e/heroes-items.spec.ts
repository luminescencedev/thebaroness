import { expect, test } from "@playwright/test";

// Parcours héros, builds et items : navigation croisée par liens internes.
test("héros, build, fiche item et retour", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Parcours couvert en desktop.");
  await page.goto("/heroes?role=mystic");
  await expect(page.getByRole("button", { name: "Mystic" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("link", { name: /Celeste/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Celeste" })).toBeVisible();
  await page.getByRole("tab", { name: "Builds" }).click();
  await expect(page).toHaveURL(/tab=builds/);
  const first = page
    .getByRole("link", { name: /Basic Magazine|Close Quarters|Berserker|Extra|Fleetfoot/ })
    .first();
  await first.click();
  await expect(page).toHaveURL(/\/items\/\d+\?hero=/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Retour à Celeste/ }).click();
  await expect(page).toHaveURL(/\/heroes\/\d+\?tab=builds/);
  await page.goBack();
  await expect(page).toHaveURL(/\/items\//);
});

test("catalogue d'items : filtre, tri, fiche", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Parcours couvert en desktop.");
  await page.goto("/items");
  await page.getByRole("button", { name: "Esprit" }).click();
  await expect(page).toHaveURL(/slot=spirit/);
  await page.getByRole("radio", { name: "Coût" }).click();
  await page.getByRole("link", { name: /Improved Spirit/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Improved Spirit" })).toBeVisible();
  await expect(page.getByText("Parties avec achat")).toBeVisible();
});
