# Rapport d'implémentation, sprint Héros, Builds et Items (18/11/2026)

Travail sur `main`, non commité. Pas de modification du back.

## 1. Pages livrées

| Route             | Contenu                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/heroes`         | En-tête compact, recherche (Échap efface), rôles, tri, compteur, grille de portraits (160 px min, colonnes automatiques de 320 à 2560 px), pastilles de complexité, état dans l'URL (`q`, `role`, `sort`).                           |
| `/heroes/:heroId` | En-tête identité (portrait, rôle, arme, complexité, tags, introduction), onglets `?tab=` : Aperçu (méta, base, histoire), Capacités (description toujours visible), Builds, Statistiques (winrate par rang, paires d'items).         |
| `/items`          | Catalogue en grille avec vraies icônes (repli catégorie + tier), recherche, catégorie, tier, coût, boutique, tri nom/coût/tier/achats, volume d'achats et winrate joints depuis une seule requête `/items/stats`.                    |
| `/items/:itemId`  | Identité (catégorie, tier, coût, boutique, actif/passif, composition), statistiques filtrables (7 j/30 j, type de partie, héros), états « Échantillon insuffisant » et « Item introuvable », associations quand un héros est choisi. |

## 2. Composants et hooks partagés

- `src/features/items/hooks.ts` : `useUpgradeCatalog` (même clé que `useItemCatalog`), `useItem`, `useItemsStats`, `useItemStats`, `useHeroBuilds`, `useHeroItemPairs`.
- `tone.ts` (tons de catégorie, partagés avec le Match Detail), `ItemThumb`/`ItemLink`, `PairsList`, `StatsScopeBar`, `statsScope.ts`, `useItemFilters`, `useHeroFilters`.
- `src/features/heroes/detail/` : `MetaPanel`, `AbilitiesPanel`, `BuildsPanel`, `PairsPanel`.
- Réutilisés : `RadialGauge`, `ChartFrame`, `BulletBar`, `DeltaChip`, `Segmented`, `SearchField`, `DoubleBezel` (un seul, l'en-tête de la fiche item), Base UI Tabs.

## 3. API utilisées

`GET /heroes`, `/heroes/:id`, `/heroes/:id/stats`, `/heroes/:id/builds`, `/heroes/:id/item-pairs`, `/items?type=upgrade`, `/items/:id`, `/items/stats`, `/items/:id/stats`, `/ranks`. Types dans `src/api/types.ts`, fonctions dans `src/api/catalog.ts`.

## 4. Décisions UX

- Builds : liste à gauche (bande défilante sous 1024 px), détail à droite avec les catégories dans l'ordre de l'auteur, annotations, lien vers la fiche item (avec `?hero=` pour revenir). Texte explicite : ni officiel, ni achats réels.
- Favoris : seul le compteur du tri demandé est affiché ; null donne « Favoris non renseignés pour ce tri », jamais 0.
- Items : pas de pourcentage de choix. « Achats » = parties avec achat observé, texte explicatif sur la page.
- Paires : barre de volume et BulletBar de winrate contre 50 %, valeurs V/D brutes, mention « ni causalité ni recommandation ».
- Capacités : « Recharge x s » seulement si connu ; une valeur inconnue n'affiche plus « Passive ».
- Navigation : entrée « Items » (Explorer), fil d'Ariane Items > fiche, palette de commandes, bouton retour et sidebar masquable inchangés. Changer d'onglet héros crée une entrée d'historique.
- Graphique par rang : défilement horizontal dans la carte sous 400 px (12 paliers) au lieu de déborder la page.

## 5. Mock et données réelles

Fixtures synthétiques dans `src/mocks/itemsMock.ts`, conformes à l'OpenAPI 1.11.0 : item sous le seuil (dernier du catalogue), item absent (404), vente inconnue, héros sans build (dernier héros), héros sans paire (avant-dernier), compteur de favoris à 0 et à null, build sans nom, auteur null, section sans nom, `wins + losses` différent de `matches`. Ce ne sont pas de vraies statistiques. Aucune icône d'item dans le mock : tuile de repli. Le vrai back n'a pas pu être lancé (Docker indisponible) : intégration non vérifiée contre une instance.

## 6. Tests et vérifications

- `npm run typecheck`, `npm run lint`, `prettier --check` : OK.
- `npm run test` : 121 tests passent (11 nouveaux : filtres héros dans l'URL, onglets, sélection de build, favoris null, héros sans build ni paire, historique d'onglet, filtre et tri des items, source de stats indisponible, fiche item, échantillon insuffisant, 404, retour au héros).
- `npm run build` : OK (avertissement de taille de chunk préexistant).
- `npm run test:e2e` : 18 passent, 4 ignorés (parcours desktop sur mobile). Deux nouveaux parcours : héros, build, fiche item, retour ; catalogue, filtre, fiche.
- Débordement horizontal (document et `.app-scroll`) mesuré à 320, 390, 768, 1024, 1280, 1440, 1920 et 2560 px sur 8 routes : aucun, après correction du graphique par rang.

## 7. Captures (`screenshots/`)

Heroes, heroes-filters, hero-overview, hero-abilities, hero-builds, hero-pairs, hero-nobuilds, items, items-filters, item, item-hero, item-lowsample, item-notfound, aux largeurs 1440, 1920 et 390 ; items et fiche héros avec sidebar masquée. Inspectées par l'œil : heroes (1440, 1920, 390), items (1440, 1920, 390), item (1440, hero filtré, échantillon insuffisant), hero overview/builds/pairs (1440, 390), builds sidebar masquée.

## 8. Limites

- Non regardés à l'œil : 768, 1024, 1280, 2560 (mesure de débordement seulement), item-notfound, hero-nobuilds, hero-abilities.
- Clavier et infobulles : couverts par les tests (rôles, aria-pressed, radiogroupes), pas de passage manuel complet au lecteur d'écran.
- Pas de filtre héros dans le catalogue d'items (une requête par héros serait un N+1) ; le filtre existe sur la fiche item.
- `isStale`/`isPartial` : affichés par `DataMetaNotice`, non simulés dans les nouveaux mocks.
- E2E `journey` instable en run complet par le passé : 18 passent dans le dernier run.

## 9. Régressions identifiées

Aucune sur les pages précédentes (121 tests, 18 e2e). Le typage nullable de `CatalogItem.name` a imposé un repli « Objet n°id » dans `matchModel` et le Match Detail (sans changement visible quand le nom existe).
