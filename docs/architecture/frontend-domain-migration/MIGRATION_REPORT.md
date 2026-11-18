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
- **Accueil** : traité depuis (voir « Méta groupée »).

## 9. Travaux restants

1. ~~Méta groupée pour l'accueil~~ : livrée par le back v1.14.0 (`GET /heroes/stats`) et consommée (voir « Méta groupée »).
2. Afficher `avatarUrl` du classement (sprint Classement).
3. Valeur nette par minute dans le résumé de partie, pour retirer `netPerMinute` des lignes d'historique.
4. Dépréciations annoncées par le back (`teams[].outcome`, `/trends.rolling`) : le front ne les lit plus ; à confirmer avant retrait côté back.
5. ~~Dédoublonner `useItemCatalog` et `useUpgradeCatalog`~~ : fait (voir « Finalisation »).

## Finalisation (18/11/2026, après le commit `4dd4741`)

**Fait**

- `useItemCatalog` (profil, partie) et `useUpgradeCatalog` (items, builds) partageaient déjà la clé `["items","upgrade"]` mais étaient deux définitions. Elles sortent maintenant d'une seule fabrique d'options (`items/hooks.ts`) : même requête, même cache, `enabled` conservé pour le chargement à la première ligne dépliée. Test : une seule requête réseau pour les deux vues, aucune tant que `enabled` est faux.
- `useHeroesMeta(ids)` : l'accueil ne lit plus la méta dans chaque ligne. Même nombre de requêtes (une par héros, clés partagées avec la fiche héros), mais un seul point à remplacer quand le back livrera la méta groupée. Test de référence : une lecture par héros du widget, jamais deux.
- Recherche de joueurs : la clé de cache est normalisée (casse, espaces), donc palette, page de recherche et formulaire de groupe partagent une entrée. Tests : rafale de frappes avec debounce (une seule requête), annulation de la requête précédente, deux consommateurs, une requête.
- Classement : `staleTime` de 5 minutes (retour sur une région déjà vue sans relancer le calcul à froid du back, ~8,6 s mesurés).

**Non modifié volontairement**

- `netPerMinute`, `matchKda` (lignes d'historique) : `include=summary` fournit `kda` mais pas la valeur nette par minute ; il n'est pas adopté (8,5 s à froid pour 50 résumés, aucune requête retirée). Les deux fonctions restent la seule implémentation locale de ces métriques, utilisée par l'affichage d'une ligne. À retirer quand le back ajoutera `netWorthPerMinute` au résumé.
- `isOwner` dans `matchModel` : identification du joueur du profil dans la partie (SteamID, sinon héros et K/D/A). Ce n'est pas une métrique, c'est un repli d'identité tant que le détail de partie ne désigne pas le joueur consulté.
- `maxNet`, `maxDmg`, `FEW_GAMES` : présentation.

**Dépend du back**

- `netWorthPerMinute` dans `summary`.
- Désignation du joueur consulté dans `/matches/:id` (supprimerait `isOwner`).
- (livré en v1.14.0, non consommé) `summary.netWorthPerMinute` : utile seulement si `include=summary` est adopté.

## Méta groupée (back v1.14.0, 18/11/2026)

- Contrat copié (`src/contracts/openapi.yaml` v1.14.0, `479348f`), type `HeroMetaBatch`, `getHeroesStats(ids)`.
- `useHeroesMeta(ids)` fait UNE requête `GET /heroes/stats?heroIds=…` (ids dédupliqués et triés, `staleTime` 30 min). Les 7 requêtes `/heroes/:id/stats` de l'accueil disparaissent ; `/heroes/:id/stats` reste utilisé par la fiche héros. Héros absent de la réponse ou sans donnée : « n/d », jamais 0 ; erreur de l'endpoint : les lignes restent, valeurs « n/d ».
- Mesure (mock, avant `d66e85b`, après working tree) : accueil 11 à 5 requêtes. Vérifié sur le vrai back v1.14.0 local : 1 requête groupée, `scope` 30 jours / normal, `unknownHeroIds` respecté, valeurs identiques à `/heroes/6/stats` (2 144 429 parties, 52,07 %, 32,17 %), 0,45 s. Capture `real-accueil-1440.png`.
- Mock : handler `/heroes/stats` déclaré avant `/heroes/:heroId` (sinon « stats » serait lu comme un identifiant).
- Non adopté : `summary.netWorthPerMinute` (v1.14.0) existe maintenant, mais `include=summary` reste non adopté (la ligne de partie a besoin du détail complet pour équipes, build et tirs critiques). `netPerMinute` reste donc la seule implémentation locale, utilisée par l'affichage d'une ligne.
