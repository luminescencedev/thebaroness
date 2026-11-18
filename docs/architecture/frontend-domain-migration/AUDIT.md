# Audit du frontend : responsabilités métier (18/11/2026)

> Mis à jour : le back a livré les v1.12.0 et v1.13.0 après cet audit. Les constats 3 et 4 sont résolus (voir `MIGRATION_REPORT.md`). Le texte ci-dessous décrit l'état de départ.

Base : front `b2effca`, back `ebaabd2` (OpenAPI 1.11.0). Le back n'a livré **aucun** nouveau champ depuis : `git pull` donne « Already up to date », pas de `docs/architecture/domain-boundary/`, `docs/openapi.yaml` toujours en 1.11.0. Les vagues qui dépendent d'un nouveau contrat sont donc bloquées et documentées ; seul le travail indépendant a été fait.

## Méthode

Lecture de `src/` (lib, features, pages), inventaire des exports et de leurs usages réels (`grep` par symbole, détection de fichiers sans importeur), inventaire des hooks et clés TanStack Query, comptage des requêtes API par parcours (Playwright sur le mock, avant et après).

## Constats

1. **Code mort hérité** du temps où le profil calculait tout côté client : 14 exports de `lib/stats.ts` sans aucun appelant (agrégats, série glissante, écarts récents, séries, rôles, distributions de KDA et de durée, calendrier local, heures, modes), `matchesMode` / `MODE_FILTERS` de `lib/modes.ts` (le filtrage est serveur depuis la v1.9.0), 3 composants sans importeur (`MatchesTable`, `StatsGrid`, `SearchForm`).
2. **Formules dupliquées** : 4 implémentations du KDA `(K + A) / max(D, 1)` (`lib/stats`, `matchModel`, `matches/detail/model`, `MatchesTable`) ; 3 décodeurs du score de rang `tier * 6 + sous-rang` (`RankModesWidget`, `groups/compare`, `charts/RankProgress`). Risque de divergence d'arrondi ou de bornes.
3. **Requêtes N+1 sans endpoint groupé** (non résolubles sans le back) : profil jusqu'à 12 lectures de méta héros, accueil 7 lectures `/heroes/:id/stats`, Mes suivis 2 requêtes par joueur (`/players/:id` et `/matches?limit=10`).
4. **Requêtes superflues** (résolubles côté front) : l'aperçu du profil lisait la méta de tous les héros (jusqu'à 12) alors qu'il n'en affiche que 3.
5. **Calculs légitimes côté front** : tri et filtres du catalogue, tri des lignes de match, sélection du joueur, chronologie des achats, totaux d'équipe sur les 12 joueurs (aucun total fourni), classement MVP local « 1er en valeur nette », courbes (présentation).
6. **Hygiène TanStack Query** : tous les `queryFn` reçoivent `signal` ; recherche débouncée (palette, formulaire de groupe) et clé partagée entre recherche, palette et formulaire ; clé `["matches", id]` partagée entre page partie et ligne dépliée ; clé catalogue `["items","upgrade"]` unique ; `keepPreviousData` réservé aux filtres d'une même entité (cf. sprint Items). Aucun refetch incontrôlé trouvé.
7. **Page Classement** : déjà consolidée côté back (rang, badge, héros, `inferred` dans `/leaderboard`), aucune requête de profil par ligne.

## Hors périmètre

Aucune refonte visuelle. Les composants de graphique non utilisés (`BarList`, `Donut`, `Histogram`, `HourBars`, `LineChart`, `Radar`, `Sparkline`, `StackedKDA`) appartiennent à la bibliothèque du design system et sont conservés.
