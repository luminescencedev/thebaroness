# Inventaire des calculs (18/11/2026, mis à jour avec le back v1.13.0)

Décisions : **Garder** (front), **Déplacer** (back, contrat à demander), **Remplacer** (champ back existant), **Supprimer** (inutilisé), **Temporaire** (conservé en attendant un contrat).

## `src/lib/stats.ts`

| Fonction                                                                                                                                                                                                                                                                    | Usage                                               | Décision                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `kdaRatio` (nouveau) / `kda` / `matchKda`                                                                                                                                                                                                                                   | affichage KDA par partie, comparaisons de la partie | Garder : formule unique ; le back ne livre pas de KDA par partie                               |
| `netPerMinute`                                                                                                                                                                                                                                                              | ligne de partie, courbe                             | Garder (présentation d'une ligne) ; **Déplacer** à terme si le back ajoute `netWorthPerMinute` |
| `median`                                                                                                                                                                                                                                                                    | histogramme (bibliothèque)                          | Garder                                                                                         |
| `heroRows`                                                                                                                                                                                                                                                                  | écart face à la méta (points)                       | Temporaire : différence de deux taux fournis ; **Déplacer** avec l'endpoint groupé de méta     |
| `calendarFromDays`                                                                                                                                                                                                                                                          | grille 12 semaines depuis `/activity`               | Garder (mise en forme)                                                                         |
| `downsample`                                                                                                                                                                                                                                                                | courbes de rang                                     | Garder                                                                                         |
| `ROMAN`                                                                                                                                                                                                                                                                     | libellés                                            | Garder                                                                                         |
| `aggregate`, `rollingWinRate`, `recentDelta`, `streaks`, `rolesPlayed`, `kdaDistribution`, `kdaBinIndex`, `KDA_BINS`, `winRateByDuration`, `DURATION_BUCKETS`, `calendar`, `hourDistribution`, `modeBreakdown`, `ModeRow`, `RoleRow`, `Aggregate`, `RecentDelta`, `Streaks` | aucun appelant                                      | **Supprimer** (remplacés par `/overview`, `/activity`, `/trends`, `/heroes`)                   |

## `src/lib/rank.ts` (nouveau contenu)

`rankScore`, `decodeRankScore`, `scoreLabel` : arithmétique du score de rang `tier * 6 + sous-rang` en un seul endroit (3 copies supprimées). **Garder** : le score est défini par le back (`RankHistoryPoint.score`) et le front ne fait que le nommer.

## `src/lib/modes.ts`

`matchesMode`, `MODE_FILTERS`, `ModeKey` : **Supprimer** (filtrage serveur). `MATCH_MODE_LABEL`, `GAME_MODE_LABEL`, `modePill`, `modeComboLabel` : **Garder** (libellés).

## Match Detail (`lib/matchModel.ts`, `matches/detail/model.ts`, `MatchTeamComparison.tsx`)

| Fonction                                                                        | Décision                                                                                                             |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `kdaOf` (x2)                                                                    | **Remplacer** par `kdaRatio` partagé (fait)                                                                          |
| KP (`enrichMatch`)                                                              | Déjà **Remplacer** : `killParticipation` du back, repli calculé seulement si absent (garder le repli : anciens back) |
| `mvpRank`, `finalItemIds`, `stats`                                              | champs back déjà consommés                                                                                           |
| `teamTotal`, `maxKnown`                                                         | Garder : le back ne fournit pas de totaux d'équipe ; règle front « total seulement si les 6 valeurs existent »       |
| `netRank`, badges « 1er en valeur nette », « Meilleur KDA »                     | Temporaire ; **Déplacer** si le back expose `netWorthRank` et `kdaRank`                                              |
| `buildBoard`, `sortPlayers`, `defaultSelection`, `purchaseTimeline`, `resultOf` | Garder (tri, sélection, chronologie, état UI)                                                                        |

## Profil

| Élément                                                                       | Décision                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| KPI, héros, parties, activité, rang, relations, tendance                      | déjà fournis par le back (`/overview`, `/heroes`, `/matches`, `/activity`, `/rank-history`, `/relationships`, `/trends`)                                                                                                                                                             |
| Courbe de performance (`RecentPerformance`) : winrate glissant sur 10 parties | Temporaire : calculé sur les 50 dernières parties chargées. `/trends.rolling` existe mais (a) ignore `period`, (b) est défini à la 10e partie (le front l'affiche dès la 5e) : le remplacer changerait le périmètre. **Déplacer** : demander une série `performance?period=&window=` |
| Moyenne de la courbe, bornes d'axe                                            | Garder (présentation)                                                                                                                                                                                                                                                                |
| Méta des héros (`useProfileData`)                                             | 1 requête par héros : **Déplacer** (endpoint groupé). Réduit côté front à 3 requêtes dans l'aperçu, 12 dans l'onglet Héros                                                                                                                                                           |

## Groupes (`features/groups/compare.ts`, `GroupDetailPage.tsx`)

| Fonction                                             | Décision                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `rankDelta` (dernier moins premier de `rankHistory`) | Temporaire ; **Déplacer** : `rankDelta` par membre                                                                |
| `buildHighlights` (6 titres)                         | Temporaire ; **Déplacer** : `highlights` dans `/groups/{id}/compare` (règles de classement à valider par le back) |
| `sortMembers`, `currentScore`, `SORTS`               | Garder (tri d'affichage) ; `currentScore` utilise `rankScore` partagé                                             |
| `scoreLabel`                                         | déplacé dans `lib/rank.ts`                                                                                        |

## Mes suivis (`tracked-players/insights.ts`, `TrackedPage.tsx`)

`useTrackedInsights` : 2 requêtes par joueur suivi. **Déplacer** (`GET /tracked-players/insights`, réponse partielle par joueur). Le décompte V/D des 10 dernières parties dans `TrackedPage` est une présentation, Garder.

## Classement, recherche, accueil

Classement : rien à retirer (badges, `inferred`, héros déjà fournis). Recherche : une seule clé `playerKeys.search(q)` partagée, débounce déjà en place, récents locaux conservés. Accueil : `MetaWidget` lit la méta par `GET /heroes/stats` (une requête, v1.14.0) ; pas de calcul métier.

## Items (`items/catalogView.ts`, `costs.ts`, `format.ts`)

Recherche, tri, filtre catégorie et coût exact, options de coût dérivées du catalogue : **Garder** (catalogue de ~250 objets en mémoire, aucun appel réseau par filtre). `resaleTime` : Garder (présentation d'un champ fourni).

## Mise à jour après la livraison du back v1.12.0 et v1.13.0

| Élément                                                                                            | Décision                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RecentPerformance` : KDA, net/min, winrate glissant                                               | **Remplacé** par `/trends` `series` (fait)                                                                                                                    |
| `heroRows` : écart face à la méta, 12 lectures de méta                                             | **Remplacé** par `globalMeta`, `winRateVsMeta`, `metaContext` (fait)                                                                                          |
| `teamTotal`, `netRank`, `kdaOf` x2, `csPerMin`, KP de repli, badges (`detail/model`, `matchModel`) | **Remplacé** par les champs de `/matches/:id` (fait)                                                                                                          |
| `resultOf`                                                                                         | **Garder** (lit `result`, repli sur `winningSide` pour un back plus ancien, jamais `outcome`)                                                                 |
| `maxKnown`, `maxNet`, `maxDmg`                                                                     | **Garder** : échelle des barres (présentation)                                                                                                                |
| `rankDelta`, `currentScore`, `buildHighlights`                                                     | **Remplacé** par `rankDelta`, `currentRankScore`, `highlights` (fait) ; `sortMembers`, `SORTS`, `highlightCards` (nom et mise en forme des titres) **Garder** |
| `useTrackedInsights` (2N requêtes)                                                                 | **Remplacé** par `/tracked-players/insights` (fait)                                                                                                           |
| `EntryRank` + `usePlayer` du classement                                                            | **Supprimé** (`badge` du classement)                                                                                                                          |
| `netPerMinute`, `matchKda` par ligne d'historique                                                  | **Garder** : `include=summary` ne donne pas la valeur nette par minute et n'est pas adopté (voir `MIGRATION_REPORT.md` section 8)                             |
| `heroRows.few` (seuil 5)                                                                           | **Garder** : indication d'interface, alignée sur `highlightMinMatches`                                                                                        |
| `Histogram`, `median`, `ROMAN` en double                                                           | **Supprimé** / unifié                                                                                                                                         |
| Méta de l'accueil                                                                                  | **Remplacé** par `GET /heroes/stats` (v1.14.0)                                                                                                                |
