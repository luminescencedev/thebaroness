import { expect, test } from "@playwright/test";

// Parcours T-17 : connexion Steam (mock), suivi, édition, suppression.
test("parcours complet : connexion, suivi, modification, suppression", async ({ page }, info) => {
  test.skip(
    info.project.name === "mobile",
    "Parcours couvert en desktop, le mobile a son propre test.",
  );
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Connexion Steam" })
    .click();
  await expect(page.getByRole("button", { name: /Compte de Corvid/ })).toBeVisible();

  // Rechercher puis suivre un joueur.
  // Navigation interne : un rechargement complet (goto) ferait perdre la session en mémoire.
  await page.getByLabel("Pseudo Steam ou SteamID64").fill("corvid jr");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await page.getByRole("link", { name: /Corvid Jr/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Corvid Jr" })).toBeVisible();
  await page.getByRole("button", { name: "Suivre", exact: true }).click();
  await page.getByLabel("Alias").fill("Petit frère");
  await page.getByLabel("Tags").fill("duo");
  await page.getByLabel("Tags").press("Enter");
  await page.getByRole("button", { name: "Suivre ce joueur" }).click();
  await expect(page.getByRole("link", { name: "Voir le suivi" })).toBeVisible();

  // Lire, modifier, recharger l'état, supprimer.
  await page.getByRole("complementary").getByRole("link", { name: "Mes suivis" }).click();
  await page.getByRole("link", { name: /Petit frère/ }).click();
  await page.getByLabel("Note").fill("Analyse mise à jour");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Analyse mise à jour")).toBeVisible();

  await page.getByRole("button", { name: /^Ne plus suivre/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ne plus suivre", exact: true })
    .click();
  await expect(page.getByRole("link", { name: /Petit frère/ })).toHaveCount(0);
});

test("une route privée sans session redirige vers la connexion", async ({ page }) => {
  await page.goto("/tracked");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Se connecter avec Steam" })).toBeVisible();
});

test("la palette s'ouvre au clavier et lance une recherche", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Raccourci clavier : desktop.");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder(/Chercher un joueur/).fill("corvid");
  await expect(page.getByText("Tous les résultats pour")).toBeVisible();
  await page.getByText("Tous les résultats pour").click();
  await expect(page).toHaveURL(/\/search\?q=corvid/);
  await expect(page.getByRole("link", { name: /^Corvid(?! Jr)/ })).toBeVisible();
});
