# Rapport de migration (18/11/2026)

Back : **v1.13.0** (`5249360`, v1.12.0 « frontière des règles métier » puis v1.13.0 `include=summary`). Contrat copié dans `src/contracts/openapi.yaml`. Tout est additif : les nouveaux champs sont optionnels côté types, un back plus ancien donne « n/d » sans erreur (aucun repli de calcul).

## 1. Calculs supprimés du front

| Avant                                                                                                                           | Maintenant                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `matchKda`, `netPerMinute` et la boucle de winrate glissant de la courbe (`RecentPerformance`)                                  | `/trends` `series[].kda`, `netWorthPerMinute`, `rollingWinRate`                                                                                                       |
| 12 lectures de méta héros du profil (`useQueries`) et `heroRows` avec `meta`                                                    | `/players/:id/heroes` : `globalMeta`, `winRateVsMeta`, `metaContext`                                                                                                  |
| `teamTotal` (sommes locales), `kdaOf` x2, `netRank` x2, `csPerMin`, repli de KP, badges calculés (`matchModel`, `detail/model`) | `/matches/:id` : `kda`, `netWorthRank`, `teamNetWorthRank`, `lastHitsPerMinute`, `performanceTags`, `killParticipation`, `teams[].totals`, `totalsCoverage`, `result` |
| `rankDelta`, `currentScore`, `best`, `buildHighlights` (groupes)                                                                | `/groups/:id/compare` : `rankDelta`, `currentRankScore`, `highlights`, `methodology`                                                                                  |
| `useTrackedInsights` : `/players/:id` et `/players/:id/matches?limit=10` par suivi                                              | `GET /tracked-players/insights` (une requête)                                                                                                                         |
| `EntryRank` du classement : jusqu'à 10 `/players/:id`                                                                           | `badge` résolu par `/leaderboard`                                                                                                                                     |
| (session précédente) 14 fonctions de `lib/stats`, `matchesMode`, 3 composants morts, doublons KDA et score de rang              |                                                                                                                                                                       |
| `Histogram`, `median`, doublon `ROMAN`                                                                                          |                                                                                                                                                                       |

## 2. Calculs conservés côté front, avec justification

Voir `CALCULATION_INVENTORY.md`. En bref : tri, sélection, chronologie des achats, filtres d'items, formatage et libellés des titres de groupe ; `netPerMinute` et `matchKda` par ligne de l'historique (le résumé `include=summary` ne fournit pas la valeur nette par minute) ; `maxNet` / `maxDmg` (échelle des barres) ; `FEW_GAMES` (indication « peu de parties »).

## 3. Champs back utilisés

`/trends` (`period`, `series`, `coverage.seriesMatches`, `rollingPointsComplete`), `/players/:id/heroes` (`globalMeta`, `winRateVsMeta`, `metaContext.comparable`), `/matches/:id` (voir ci-dessus), `/groups/:id/compare`, `/tracked-players/insights`, `/leaderboard` (`badge`, `avatarUrl`, `coverage` typés ; `avatarUrl` pas encore affiché, réservé au sprint Classement).

## 4. Requêtes éliminées

Voir `PERFORMANCE_COMPARISON.md` : profil 27 à 20 (méta héros), onglet Héros 23 à 16, Parties 29 à 22, Mes suivis 15 à 6 (5 suivis), classement jusqu'à 10 requêtes de profil en moins en production.

## 5. Contrats modifiés

Aucune modification du back. Front : types étendus (`TrendPoint`, `HeroMetaContext`, `PerformanceTag`, `TeamTotalKey`, `GroupHighlight`, `TrackedInsight`, `LeaderboardCoverage`), `getTrackedInsights`, `period` sur `/trends`. Texte visible : la tendance « (hors période) » devient « (tout l'historique) » seulement sans période ; le glissant démarre à la 10e partie (avant : 5e) ; progression de groupe à `null` avec un seul point (avant : 0) ; classement : « Eternus V » au lieu de « Eternus 5 5 » (le back livre déjà « Eternus 5 » dans `badge.name`).

## 6. Tests

174 passent (158 avant cette étape). Nouveaux : série de tendance (période, taille), méta du profil (aucune requête par héros, périmètre comparable ou non), totaux, KDA, rang de souls, `result`, repli sans champ (Match Detail et `enrichMatch`), insights groupés (une requête, isolement d'un suivi indisponible, plus de 100), classement sans requête de profil, tri et titres de groupe (ex æquo, seuil de 5 parties), score de rang. Typecheck, lint, Prettier, build : OK. E2E : 18 passent, 4 ignorés.

## 7. Vérification contre le vrai back v1.13.0

Copie hors dépôt de `5249360`, MongoDB locale. Joueur réel LilStick : `/trends?size=10&period=30d` (10 points, glissant complet), `/players/:id/heroes` (méta et `comparable` vrai en 30 jours normal, faux en 7 jours), `/matches/:id` (champs, totaux, `result`), `include=summary` (3 résumés en 1,2 s). Suivis et groupe avec un JWT forgé en local : `/tracked-players/insights` (4 suivis dont un introuvable isolé, `isPartial`), `/groups/:id/compare` (6 titres, `methodology`). Classement Europe : `coverage` 98 sur 100. Interface réelle visionnée : profil (aperçu, héros), classement. Mes suivis et groupes n'ont pas été vus avec le vrai back (session Steam impossible hors production) mais l'API a été interrogée et l'interface testée sur le mock.

## 8. Évalué et non adopté

- **`include=summary` sur l'historique** : la ligne de partie à grande largeur affiche les équipes, le build, le CS et les tirs critiques, que le résumé ne contient pas. Le détail complet reste nécessaire par ligne visible ; ajouter le résumé coûterait 1,2 s pour 3 parties (8,5 s à froid pour 50) sans retirer une requête. Les petits écrans (qui ne chargent pas le détail) gagneraient KP et CS par minute : à décider avec le design.
- **Accueil** : 7 lectures de méta (`/heroes/:id/stats`) restent, aucun endpoint de méta groupée n'existe.

## 9. Travaux restants

1. Endpoint de méta groupée pour l'accueil (7 lectures).
2. Afficher `avatarUrl` du classement (sprint Classement).
3. Valeur nette par minute dans le résumé de partie, pour retirer `netPerMinute` des lignes d'historique.
4. Dépréciations annoncées par le back (`teams[].outcome`, `/trends.rolling`) : le front ne les lit plus ; à confirmer avant retrait côté back.
5. Dédoublonner `useItemCatalog` et `useUpgradeCatalog` (même clé, aucun écart).
