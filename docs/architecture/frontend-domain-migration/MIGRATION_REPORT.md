# Rapport de migration (18/11/2026)

Statut du back : `ebaabd2` (OpenAPI 1.11.0), **aucun nouveau contrat** depuis le dernier sprint. La migration vers des champs consolidés (vagues A et B) est donc **bloquée** ; la vague C (nettoyage) et les gains indépendants ont été faits.

## 1. Calculs supprimés

- `lib/stats.ts` : `aggregate`, `rollingWinRate`, `recentDelta`, `streaks`, `rolesPlayed`, `kdaDistribution`, `kdaBinIndex`, `KDA_BINS`, `winRateByDuration`, `DURATION_BUCKETS`, `calendar`, `hourDistribution`, `modeBreakdown` et leurs types (aucun appelant, remplacés par `/overview`, `/activity`, `/trends`, `/heroes`).
- `lib/modes.ts` : `matchesMode`, `MODE_FILTERS`, `ModeKey` (filtrage serveur).
- Composants morts : `MatchesTable`, `StatsGrid`, `SearchForm`.
- Doublons : 3 implémentations du KDA, 3 décodeurs du score de rang, remplacés par `kdaRatio` (`lib/stats`) et `rankScore` / `decodeRankScore` / `scoreLabel` (`lib/rank`).

## 2. Calculs conservés côté front

Voir `CALCULATION_INVENTORY.md`. Justifications : présentation (tri, filtres, courbes, chronologie, sélection), valeurs sans équivalent back (totaux d'équipe, KDA par partie, valeur nette par minute, badges de classement local), ou contrat insuffisant (`/trends.rolling` ignore `period` et démarre à la 10e partie).

## 3. Champs back utilisés (inchangés)

`/overview` (KPI officiels), `/heroes` du joueur, `/matches` filtrés serveur, `/activity`, `/rank-history`, `/relationships`, `/trends`, `/matches/:id` (`killParticipation`, `mvpRank`, `finalItemIds`, `stats`), `/leaderboard` (rang, badge, héros, `inferred`), `/groups/:id/compare`.

## 4. Requêtes éliminées

Profil : méta des héros limitée à 3 dans l'aperçu (12 uniquement dans l'onglet Héros) : -4 requêtes mesurées sur le mock, jusqu'à -9 en production. Aucune autre requête n'était évitable sans nouveau contrat.

## 5. Contrats modifiés

Aucun. Demandes au back : voir `API_DEPENDENCIES.md` (`/heroes/stats`, `/tracked-players/insights`, `/players/{id}/performance`, `highlights` et `rankDelta` de groupe, rangs de partie).

## 6. Tests

162 avant, **158 après** : 9 tests des fonctions supprimées retirés, 5 ajoutés (`kdaRatio` unique et parité avec le détail de partie, `heroRows`, `rank.test.ts` x2 (encodage et décodage du score sur 1 à 72, libellés), `metaRequests.test.tsx` (3 lectures de méta dans l'aperçu, extension dans l'onglet Héros)). Typecheck, lint, Prettier, build : OK. E2E : 18 passent, 4 ignorés (parcours desktop sur mobile).

Instabilité préexistante corrigée : le premier test de certains fichiers (`flows`, `Layout`, `matchPage`) échouait par intermittence quand la machine était chargée, y compris sur le code d'avant (délai `findBy` de 1 s trop court au premier chargement paresseux). `asyncUtilTimeout` passe à 4 s et `testTimeout` à 15 s (`src/test/setup.ts`, `vitest.config.ts`) : 2 exécutions complètes consécutives à 158 sur 158, sous charge.

## 7. Régressions évitées

Même joueur et même scope : mêmes KPI (comparaison visuelle avant/après), même KDA (une seule formule, arrondi à l'affichage seulement), mêmes noms de rang. Anciens back : aucun champ optionnel nouveau n'est supposé. Page profil, Match Detail, Héros et Items inchangés visuellement.

## 8. Travaux restants (dépendent du back)

1. Remplacer les 12 lectures de méta du profil et les 7 de l'accueil par un endpoint groupé.
2. Migrer `useTrackedInsights` vers une réponse groupée (réponse partielle par joueur).
3. Consommer une série de performance serveur (courbe, valeur nette, winrate glissant avec couverture) et retirer le calcul sur 50 parties.
4. Consommer `rankDelta` et `highlights` de groupe, retirer `buildHighlights` et `rankDelta`.
5. Retirer `netRank` et les badges locaux de la partie si `netWorthRank` / `kdaRank` sont livrés.
6. Dédoublonner `useItemCatalog` (profil) et `useUpgradeCatalog` (items) : deux hooks sur la même clé, sans divergence aujourd'hui.
