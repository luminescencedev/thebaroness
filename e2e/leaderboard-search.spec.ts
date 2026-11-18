import { expect, test } from "@playwright/test";

// Sprint 2 : classement (région dans l'URL, lignes) et recherche (champ intégré, URL, homonymes, SteamID64).

test("classement : région dans l'URL, lignes cliquables seulement avec un SteamID, pas de débordement", async ({
  page,
}) => {
  await page.goto("/leaderboard");
  const list = page.getByRole("list", { name: "Joueurs classés" });
  await expect(list).toBeVisible({ timeout: 15_000 });
  await expect(list.getByRole("listitem").first()).toBeVisible();
  await expect(page.getByText(/comptes\s+identifiés sur/)).toBeVisible();
  // Au moins une ligne sans lien (entrée non reliée) et au moins un lien de profil.
  expect(await list.getByRole("link").count()).toBeGreaterThan(0);
  expect(await list.getByRole("listitem").count()).toBeGreaterThan(
    await list.getByRole("link").count(),
  );

  await page.getByRole("tab", { name: "Asie" }).click();
  await expect(page).toHaveURL(/\/leaderboard\?region=Asia/);
  await expect(page.getByRole("tab", { name: "Asie", selected: true })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("classement : un lien partagé ouvre la bonne région", async ({ page }) => {
  await page.goto("/leaderboard?region=Oceania");
  await expect(page.getByRole("tab", { name: "Océanie", selected: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Joueurs classés" })).toBeVisible({
    timeout: 15_000,
  });
});

test("recherche : saisie, URL mise à jour, résultats et ouverture d'un profil", async ({
  page,
}) => {
  await page.goto("/search");
  const box = page.getByRole("searchbox", { name: "Pseudo Steam ou SteamID64" });
  await box.fill("corvid");
  await expect(page).toHaveURL(/\/search\?q=corvid/);
  await expect(page.getByRole("heading", { name: "Correspondance exacte" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pseudos proches" })).toBeVisible();
  await page.getByRole("link", { name: /^Corvid(?! Jr)/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Corvid" })).toBeVisible();
});

test("recherche : un SteamID64 saisi ouvre le profil, sans résultat intermédiaire", async ({
  page,
}) => {
  await page.goto("/search");
  await page.getByRole("searchbox").fill("76561198000000000");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/players\/76561198000000000/);
});

test("recherche : zéro résultat", async ({ page }) => {
  await page.goto("/search?q=vide");
  await expect(page.getByText(/Aucun joueur pour/)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
