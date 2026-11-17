# Intégration du back v1.9.0 dans le profil joueur

Date : 17/11/2026. Branche `refonte-ui`, arbre de travail non commité. Aucun commit, aucun push, aucun déploiement, back non modifié.

## 1. Références inspectées

- Back : `LilStick/thebaroness-back`, `main`, HEAD `215075d` (« profil joueur V2 (P0), overview et filtres serveur (#80) »), OpenAPI **1.9.0**. Pas de commit plus récent au moment de l'audit.
- Lus : `docs/HANDOFF.md`, `docs/openapi.yaml`, diff `2280640..215075d` (routes, service, `profile-stats.ts`, tests).
- Front : `src/contracts/openapi.yaml` remplacé par la copie v1.9.0 (en-tête de provenance).

## 2. Différences entre les contrats (v1.8.0 vers v1.9.0)

Tout est additif. Seuls trois chemins changent :

| Route                        | Changement                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /players/{id}/overview` | **nouvelle** : `filters`, `summary`, `modes`, `topHeroes` (3), `coverage`, `meta`                                                                            |
| `GET /players/{id}/matches`  | + `period`, `gameMode`, `matchMode`, `heroId`, `outcome` ; curseur lié aux filtres ; `appliedFilters`                                                        |
| `GET /players/{id}/heroes`   | + `period`, `gameMode`, `matchMode` ; `PlayerHeroStat` + `losses`, `kdaSampleSize`, `avgNetWorthPerMinute`, `netWorthPerMinuteSampleSize` ; `appliedFilters` |

Audit des autres zones : recherche, classement (`inferred` reste optionnel et non affiché), catalogue et fiches héros, détail de partie, groupes, suivis, authentification Steam, refresh : aucun changement de contrat, aucun correctif nécessaire (16 tests e2e et la suite unitaire passent). Le détail de partie réel **ne contient toujours ni `items` ni `headshotPct`**.

## 3. Ce qui a été fait

**API et types** (`src/api/types.ts`, `players.ts`, `catalog.ts`) : `ProfileScope`, `StatPeriod`, `GameModeFilter`, `MatchModeFilter`, `OutcomeFilter`, `AppliedFilters`, `PlayerOverview` (+ sous-types), `MatchHistoryParams` étendu, `PlayerHeroStat` étendu, `getPlayerOverview`, `getPlayerHeroes(steamId, scope?)`.

**Scope unique** (`features/players/scope.ts`) : période (`7d|30d|season`, défaut `30d`), format (`gameMode`) et type (`matchMode`) vivent dans l'URL, sont validés (valeur inconnue : défaut), et alimentent ensemble l'aperçu, la courbe, l'activité, la liste des parties et l'onglet Héros. Ils sont **toujours envoyés explicitement** : le profil n'utilise jamais le comportement « sans période » de `/matches` et `/heroes`. `gameMode` et `matchMode` restent deux axes séparés (deux sélecteurs). Filtres propres aux parties : `outcome`, `matchHero` (URL).

**Hooks** (`features/players/hooks.ts`) : clés `["players", id, "overview"|"matches"|"heroes", ...scope/filtres]`. Un nouveau filtre = nouvelle clé = première page sans curseur, sans réutiliser les données du filtre précédent (pas de `keepPreviousData`). `refresh` invalide les trois préfixes.

**Composants** (design inchangé) : `ScopeBar` (nouveau, à droite des onglets), `scopeText.ts` (libellés et messages de couverture), `RankModesWidget` (rang officiel indépendant du filtre + `overview.modes`), `TopHeroesWidget` (`overview.topHeroes`), `RecentPerformance` (4 KPI officiels, courbe 10/20/50 sur les parties du scope, libellée à part), `ActivityWidget` (borne de période explicite), `OverviewLayout`, `MatchesTab` (filtres serveur, pagination « Charger plus », états chargement, erreur, vide), `HeroesTab` (`losses`, échantillon KDA). `MatchRow`, `MatchBuild`, `MatchTeams`, `useMatchEnrichment`, `matchModel` sont **conservés tels quels**.

## 4. KPI maintenant fournis par le back

Parties, victoires, défaites, winrate, KDA (+ taille d'échantillon), valeur nette par minute (moyenne des ratios par partie, + échantillon), durée moyenne, dernière partie, modes (format x type), top 3 héros, couverture. Le front n'agrège plus rien de ces valeurs. Restent calculés localement (et signalés) : la courbe (parties du scope déjà chargées), le calendrier d'activité, KP / CS / position (détail de partie).

Couverture affichée : plage observée, saison sans début connu (aucune borne appliquée, dit à l'écran), parties au mode inconnu écartées ou comptées, historique ancien. Aucun faux zéro : compteur à 0 et ratios `null` donnent « n/d » ou un état vide.

## 5. Pagination serveur

Le serveur filtre sur tout l'historique puis pagine (pages de 50). `MatchesTab` charge page par page ; la courbe et l'activité lisent le même historique du scope (jusqu'à 200 parties). Quand aucun filtre propre aux parties n'est actif, l'onglet Parties et l'historique partagent la même clé de cache. Le back ne donne pas de total : le compteur dit « N parties chargées » et « d'autres sont disponibles ». Les tris par KDA ou durée ont été retirés (l'API ne trie que par date).

## 6. Données de match réelles, mock, en attente

- Réel : résultat, héros, mode, durée, K/D/A, KDA, valeur nette, par minute, **CS** (`lastHits`), **KP**, position par valeur nette, participants, équipes.
- Mock seulement : items et pourcentage de tirs à la tête, signalés « exemple synthétique du mode démo ». En production : « n/d ».
- En attente du back : `items`, `headshotPct`, `/activity`, `/rank-history`, calibration, tendances, coéquipiers.

## 7. Tests

| Suite                                               | Résultat                                                                                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck, lint, build, Prettier (fichiers touchés) | OK                                                                                                                                                  |
| Unitaires et intégration                            | **80 passés** (27 nouveaux : `api/profileV19.test.ts` 14, `features/players/profileScope.test.tsx` 10, `mocks/profileV2.test.ts` 3 ; flows adaptés) |
| E2E Playwright                                      | 16 passés, 2 ignorés (inchangé)                                                                                                                     |

Couvert : périodes emboîtées, modes indépendants, filtre sans résultat, énumération invalide (400), pagination multi-pages sans doublon, curseur refusé avec un autre filtre, top 3 overview = héros de l'onglet, clés de requête distinctes, URL, première page sans curseur, refresh qui relance l'overview, règles du back reproduites par le mock (KDA sur sous-ensemble complet, moyenne de ratios, mode inconnu). **Ces tests s'exécutent contre MSW : ils prouvent le comportement du front et la fidélité du mock, pas l'intégration réelle.**

## 8. Test sur un vrai back

Docker indisponible dans cette distribution. Copie du HEAD `215075d` dans le répertoire temporaire de la session (le dépôt du back n'a pas été touché), `npm ci`, MongoDB en mémoire, `REFRESH_WORKER_ENABLED=false`, **vraies données Deadlock API**, joueur FunKa (`76561198009781660`).

- 7 jours 19, 30 jours 107, saison 40, normal + classée 12, Street Brawl 0, non classée 95 : `overview.summary.matches` = nombre de parties pagineées de `/matches` pour chaque scope (3 pages de 50 pour 30 jours, 107 uniques, 60 victoires = `summary.wins`), somme de `/heroes` = 107, top 3 overview = top 3 héros.
- Curseur réutilisé avec un autre filtre : 400 `INVALID_INPUT`. Énumération invalide : 400. Joueur inconnu : 404.
- Interface réelle (Vite en mode développement sur ce back) : KPI 56,07 % / 3,78 / 107 / 1 174, rang « Sentinel VI », 7 jours puis Défaites : 8 parties, ligne dépliée avec CS 185, KP 47 %, équipes, « HS n/d » et « Build n/d ». Captures `real-1440-*.png`.
- Non testé en réel : refresh, groupes, suivis, authentification, production (qui n'a pas la v1.9.0 avant son déploiement).

## 9. Performance et cache

Chargement d'un profil : profil, overview, héros, 1 à 4 pages de parties, jusqu'à 12 requêtes de méta de héros (cache 30 min), puis un `GET /matches/:id` par ligne visible (>= 768 px, ou ligne dépliée, cache 10 min). Changer de scope relit overview, héros et parties : l'historique du back est mis en cache côté serveur (3 min), sans appel supplémentaire à Deadlock API. Le scope précédent reste en cache TanStack et se réaffiche instantanément au retour. Pas de mesure de temps comparative effectuée.

## 10. Vérifications visuelles

Débordement horizontal contrôlé par script à 320, 390, 768, 1024, 1280, 1440, 1920 et 2560 px sur 5 variantes du profil : aucun. Captures regardées à l'œil : `v19-390-overview`, `v19-1024-overview`, `real-1440-overview`, `real-1440-matches-expanded` ; les autres captures intermédiaires ont été supprimées avant le commit pour alléger le dépôt. Aucun changement du header, des onglets, du shell, du breadcrumb, de la landing.

## 11. Statut

| Fonctionnalité                                                        | Statut                                                           |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Overview (KPI, modes, top héros, couverture)                          | **Intégrée et testée sur vrai back**                             |
| Filtres serveur des parties, curseur, pagination                      | **Intégrés et testés sur vrai back**                             |
| Héros par scope (+ champs étendus)                                    | **Intégrés et testés sur vrai back**                             |
| Scope partagé dans l'URL                                              | Intégré (tests MSW et navigateur réel)                           |
| CS, KP, position, équipes dans la ligne de partie                     | Intégrés (vraies données testées)                                |
| Items et HS dans la ligne de partie                                   | Mock uniquement ; prêt en attente du back                        |
| Activité (calendrier)                                                 | Calcul local sur l'historique du scope ; `/activity` attendu     |
| Courbe de performance                                                 | Parties du scope chargées (max 200) ; cohérente avec les filtres |
| Historique de rang, calibration, tendances, coéquipiers, items/builds | En attente du back (P1, P2)                                      |
| Refresh, groupes, suivis, auth sur back réel                          | Non testés en réel                                               |

## 12. Limites et suites

- Pas de total de parties ni de tri autre que par date côté API (demandes dans `HANDOFF.md`).
- La saison sans début connu est signalée mais non filtrée (comportement du back).
- Le badge du nombre de parties sur l'onglet Parties a été retiré (le total est inconnu).
- `modeBreakdown`, `aggregate`, `matchesMode` et `MODE_FILTERS` ne sont plus utilisés par le profil ; conservés et testés, à supprimer lors d'un nettoyage.
- Vérifier la production après le déploiement du back v1.9.0.

## Addendum : phase P1 (back `1805949`, OpenAPI v1.10.0)

| Fonctionnalité                                                                                | Statut                                                                                                        |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Build réel (objets finaux, ordre d'achat, icônes) via `GET /items` (1 requête, cache 1 h)     | **Intégré, testé sur back Docker**                                                                            |
| CS, KP (valeur du back), MVP Valve, dégâts, soins, précision, tirs critiques (HS)             | **Intégrés, testés sur back Docker**                                                                          |
| Rang moyen par équipe (`averageRankName`)                                                     | Intégré (souvent `null` en non classé)                                                                        |
| Activité 12 semaines (`/activity`) suivant format et type du scope                            | **Intégrée, testée sur back Docker**                                                                          |
| Progression du rang (`/rank-history`)                                                         | **Intégrée, testée sur back Docker** (peu de points quand la source omet le badge)                            |
| Joués avec et contre (`/relationships`)                                                       | **Intégré, testé sur back Docker**                                                                            |
| `abilityUpgrades`, ventes d'objets, `/items/{id}`, stats d'objets, builds, tendances 20 vs 20 | Non utilisé ou non livré                                                                                      |
| Production                                                                                    | Le back de production n'a pas v1.10.0 avant son déploiement : widgets vides ou « n/d », sans erreur bloquante |

Choix : `heroCritRate` est affiché comme HS avec l'infobulle « tirs critiques sur héros : tirs à la tête » (à confirmer par le back) ; l'ancien contrat proposé (`items`, `headshotPct`) est retiré des types, le mock reproduit désormais les vraies formes (`finalItemIds`, `stats`, catalogue `/items`). La courbe lit au plus 50 parties (la limite de 200 servait à l'activité). Tests : 92 unitaires et d'intégration (nouveaux : résolution du build, KP/MVP/HS, calendrier depuis `/activity`, routes P1, widgets), 16 e2e. Captures `p1-*.png`. Limite : le graphique de progression de rang peut être plat ou vide selon les badges fournis par la source.

## Addendum : phase P2 (back `ebaabd2`, OpenAPI v1.11.0)

| Fonctionnalité                                                                               | Statut                                                                        |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Tendance N contre N (`/trends`), fenêtre = courbe 10 / 20 / 50, hors période                 | **Intégrée, testée sur back Docker** (valeurs identiques à l'exemple du back) |
| Statistiques d'objets, builds de héros, paires d'objets (routes répondent 200 sur le Docker) | Contrat recopié ; **aucune interface** (pages Items et Builds à décider)      |
| `rolling` de `/trends`                                                                       | Non utilisé                                                                   |

Tests : 96 unitaires et d'intégration (4 nouveaux : tendance, comparaison inégale, taille hors bornes, widget).
