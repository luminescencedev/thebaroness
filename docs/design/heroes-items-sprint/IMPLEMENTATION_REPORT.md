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

## Finalisation du sprint : prix réels, filtres et intégration backend (18/11/2026)

### 1. Ancien problème

Le filtre de coût proposait trois tranches arbitraires (`≤ 1 000`, `1 001 à 3 000`, `> 3 000`) qui ne correspondaient à aucun palier du shop, et le mock calculait `800 * tier` (tier III à 2 400, tier IV à 3 200).

### 2. Nouvelle logique : prix exacts depuis `CatalogItem.cost`

- Les options viennent du catalogue (`costOptions`) : montants valides dédupliqués, croissants, `null`, `NaN`, négatifs et infinis ignorés, 0 conservé. Aucune liste figée, aucun calcul depuis le tier.
- Les options dépendent du réglage « boutique » (Disponibles ou Tous), pas des autres filtres : elles ne disparaissent pas quand on combine recherche, catégorie ou tri.
- Plus de six montants : les prix standards (800, 1 600, 3 200, 6 400, simple critère d'affichage) puis les plus fréquents restent en boutons, le reste passe dans un menu « Autres prix » (`splitCostOptions`). Rien n'est perdu.
- Décision produit (échange du 18/11) : tier et coût sont 1 pour 1 dans le catalogue réel, la rangée Tier est donc supprimée. Un seul contrôle « Tier · Coût » affiche « II · 1 600 ». Le tier n'est affiché que si tous les objets d'un montant le partagent (les tiers inconnus sont ignorés). Si un jour ils divergent, on séparera à ce moment-là. `?tier=` reste lu depuis l'URL (anciens liens, tests) mais n'a plus de contrôle.
- Fiche item et carte : prix = `item.cost`, `n/d` si null (jamais 0). Infobulle : prix total du catalogue, ni prix payé en partie ni reste à payer pour une amélioration. `componentIds` ne servent qu'aux relations affichées. Match Detail inchangé.

### 3. Montants réellement trouvés dans le back

Back `ebaabd2` (OpenAPI 1.11.0) lancé en local (copie hors du dépôt, MongoDB locale), client Deadlock **6861**, `GET /api/items?type=upgrade` :

|                                               | Valeur                                                               |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Objets (tous)                                 | 250                                                                  |
| Objets de boutique (shopable, non désactivés) | 173 (77 retirés de la boutique)                                      |
| Coûts distincts (boutique)                    | 800 (23), 1 600 (43), 3 200 (46), 6 400 (44), 9 999 (17)             |
| Coûts distincts (tous)                        | 800 (32), 1 600 (68), 3 200 (67), 6 400 (60), 9 999 (23)             |
| Tier (boutique)                               | I 23, II 43, III 46, IV 44, V 17                                     |
| Catégorie (boutique)                          | vitalité 61, esprit 56, arme 56                                      |
| Coût null                                     | 0                                                                    |
| Nom null                                      | 0                                                                    |
| Objets avec composants                        | 61                                                                   |
| Tier x coût                                   | strictement 1 pour 1 : I 800, II 1 600, III 3 200, IV 6 400, V 9 999 |

Constats : **2 400 n'existe pas** (il n'est donc jamais proposé), et il existe un **tier V à 9 999** (17 objets en boutique) que l'ancienne interface ne savait pas nommer (le chiffre romain V manquait). Les 17 écarts aux quatre prix standards sont tous ce tier V. Le mock imite ces valeurs mais ne les remplace jamais : l'application lit `cost`.

### 4. Cas atypiques

Prix 9 999 : bouton « V · 9 999 », filtre exact fonctionnel. Coût inconnu : `n/d`, trié en dernier dans les deux sens. 0 : traité comme un montant distinct de l'inconnu (testé en unitaire, absent du catalogue réel). Montant d'URL absent du catalogue ou obsolète : ignoré puis retiré de l'URL.

### 5. Tri

Critères Nom, Coût, Tier, Achats, plus un bouton d'ordre croissant ou décroissant à côté du Segmented (une icône, pas de contrôle de plus par critère). Ordre par défaut : croissant, sauf Achats (décroissant). Changer de critère remet l'ordre par défaut. Valeur inconnue toujours en fin de liste dans les deux sens ; égalités départagées par nom puis identifiant ; tri stable et sans mutation. Logique pure dans `catalogView.ts`.

### 6. URL

`?cost=800|1600|3200|6400|9999` (tout montant valide), plus `dir=asc|desc`. `low`, `mid`, `high`, valeur invalide ou montant absent : aucune erreur, la clé `cost` est retirée une seule fois (`replace`, pas de boucle), les autres paramètres sont gardés. Retour et avance fonctionnent, le rechargement restaure le filtre.

### 7. Mocks corrigés

`synthetic.ts` : 800, 1 600, 3 200, 6 400 pour les tiers I à IV (plus de 2 400 pour le tier III). Cinq cas limites ajoutés, documentés comme synthétiques : tier V à 9 999 (présent dans le catalogue réel), coût null, tier null, objet retiré de la boutique, objet avec composants. Les 20 identifiants de base sont inchangés.

### 8. Périodes statistiques

- Catalogue : le texte annonce la période **servie** par la réponse affichée (`filters` de la réponse) ; pendant le chargement d'une autre période, l'ancienne reste annoncée avec « Actualisation en cours ».
- `keepPreviousData` remplacé par un garde par entité (`keepSameEntity`) : on garde la réponse précédente pour un changement de filtre, jamais pour un autre héros ou un autre objet (sinon les paires d'un héros seraient restées sous le nom du suivant).
- Builds : les compteurs de favoris sont lus avec le tri servi, pas celui qui vient d'être demandé ; indication « Actualisation du tri en cours ».
- Paires : titre construit avec `heroId` de la réponse.
- En cas d'erreur sur les achats du catalogue : boutons « Réessayer » et, pour 30 jours, « Voir sur 7 jours ».

### 9. Temps de revente

`resaleTime` : `sold === 0` donne « Jamais revendu » ; `sold > 0` sans durée « Temps moyen indisponible » (jamais « Aucune revente observée ») ; `sold === null` « n/d » ; durée connue formatée.

### 10. Tests

162 tests (121 avant) : 23 unitaires de coûts, filtre, tri et revente (`costs.test.ts`), 30 tests de page (options sans tranche, 1 600 dans l'URL, restauration avec combinaison, anciennes URL, montant absent, état vide, tri croissant et décroissant avec prix inconnu en dernier, réponse partielle, nouvelle version du catalogue, périodes servies, changements rapides de filtres, revente, prix n/d). Typecheck, lint, Prettier, build : OK. E2E : 18 passent, 4 ignorés (parcours desktop sur mobile).

### 11. QA visuelle

Débordement horizontal (document et zone de défilement) mesuré à 320, 390, 768, 1024, 1280, 1440, 1920 et 2560 px, sidebar visible et masquée, sur 19 routes (catalogue héros avec filtres, fiche héros 4 onglets, héros sans build, avant-dernier héros sans paire, catalogue items avec tri décroissant, coût atypique, combinaison de filtres, état vide, fiche item avec héros, sans prix, tier V, introuvable) : aucun débordement. Captures inspectées : catalogue tri coût décroissant 1440, catalogue 320 avec filtre 1 600, fiche item sans prix 1440, catalogue 390 et 1440 sur le vrai back, builds 1440 sur le vrai back. Captures `v2-*` et `real-*` dans `screenshots/`.

### 12. Vérification avec le vrai back

Docker est absent, mais le back tourne sans lui (README) : copie propre de `ebaabd2` (`git archive`, hors du dépôt, aucune modification du back), MongoDB locale (binaire en cache), front en mode réel via le proxy Vite. La production n'a pas été interrogée : sa version n'a pas été vérifiée.

| Route                                                      | Résultat                                                                                                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /heroes`, `/heroes/6`, `/heroes/6/stats`              | 200                                                                                                                                                 |
| `GET /items?type=upgrade`                                  | 200, 250 objets                                                                                                                                     |
| `GET /items?type=upgrade&shopable=true&slot=spirit&tier=2` | 200, 12 objets ; `tier=9` donne 400                                                                                                                 |
| `GET /items/:id`                                           | 200 ; id absent 404 ; id invalide 400                                                                                                               |
| `GET /heroes/6/builds` (4 tris, limit 1 à 50)              | 200 ; compteurs conformes (`favorites` seulement avec le tri favoris, `weeklyFavorites` avec `weekly_favorites`, null ailleurs) ; héros inconnu 404 |
| `GET /items/stats?period=7d` (+ ranked, + heroId)          | 200, 156 objets ; aucun champ null, `wins + losses = matches` partout                                                                               |
| `GET /items/:id/stats?period=7d`                           | 200 ; objet tier V : `stats: null`, `notes: ["below_source_threshold"]`                                                                             |
| `GET /heroes/6/item-pairs?period=7d` (+ filtres, itemId)   | 200 ; `wins + losses = matches`                                                                                                                     |
| `GET /items/stats?period=30d`                              | **503** (voir ci-dessous)                                                                                                                           |

Écarts réels : (a) la source renvoie 504 sur `item-stats` pour 30 jours à ce moment-là, et le back applique un temps de repos de 120 s (`retryAfter`) qui fait échouer aussi les requêtes 7 jours pendant ce délai ; (b) `GET /ranks` a répondu 503 pendant les tests (graphique par rang des héros dégradé) ; (c) les objets sous le seuil (les 17 objets de tier V) sont absents de `/items/stats` (confirme l'hypothèse faite) ; (d) les builds sont du contenu libre des joueurs : titres, descriptions et annotations sont affichés tels quels, sans modération (le texte multi-lignes des annotations est replié sur une ligne).

### 13. Limitations

- Le défaut de 30 jours renvoie 503 tant que la source échoue : le catalogue reste utilisable, les achats sont masqués avec « Réessayer » et « Voir sur 7 jours ». Changer le défaut en 7 jours reste une décision produit.
- Valeur de coût 0 non observée dans le catalogue réel (couverte en unitaire).
- Pas de passage manuel complet au lecteur d'écran ni de test `prefers-reduced-motion` automatisé (la rotation de la flèche de tri est désactivée sous `motion-reduce`).
- Production non interrogée.
