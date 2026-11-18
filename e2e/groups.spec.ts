import { expect, test } from "@playwright/test";

// Sprint 3 : groupes. Navigation interne uniquement : un rechargement complet ferait perdre la session en mémoire.
test("groupes : liste, comparaison, tri, période, création et suppression", async ({
  page,
}, info) => {
  test.skip(info.project.name === "mobile", "Parcours couvert en desktop (menu latéral).");
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Connexion Steam" })
    .click();
  await expect(page.getByRole("button", { name: /Compte de Corvid/ })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Groupes" })
    .click();

  const list = page.getByRole("list", { name: "Vos groupes" });
  await expect(list).toBeVisible();
  await list.getByRole("link").first().click();

  // Comparaison : tableau d'abord, puis faits marquants.
  await expect(page.getByRole("heading", { level: 2, name: "Comparaison" })).toBeVisible();
  const ranking = page.getByRole("list", { name: /Classement du groupe/ });
  await expect(ranking.getByRole("listitem").first()).toBeVisible();
  await page.getByRole("button", { name: "KDA", exact: true }).click();
  await expect(page.getByRole("list", { name: /trié par kda/i })).toBeVisible();
  await page.getByRole("radio", { name: "7 jours" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Faits marquants" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // Retour, création d'un groupe de deux joueurs par SteamID64.
  await page.getByRole("complementary").getByRole("link", { name: "Groupes" }).click();
  await page.getByRole("button", { name: "Nouveau groupe" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nom du groupe").fill("Duo e2e");
  const search = dialog.getByLabel("Ajouter un joueur");
  await search.fill("76561198000000010");
  await search.press("Enter");
  await search.fill("76561198000000011");
  await search.press("Enter");
  await expect(dialog.getByText(/2 sur 20/)).toBeVisible();
  await dialog.getByRole("button", { name: "Créer le groupe" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Duo e2e" })).toBeVisible();

  // Suppression avec confirmation.
  await page.getByRole("button", { name: "Plus d'actions" }).click();
  await page.getByRole("menuitem", { name: "Supprimer le groupe" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByRole("list", { name: "Vos groupes" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Duo e2e/ })).toHaveCount(0);
});
