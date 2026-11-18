# Sprint 2 : Classement et Recherche (18/11/2026)

Front sur `main` (base `384b413`), back v1.14.0 (`479348f`), aucun changement de contrat ni de back. Rien n'est commité à la date de ce rapport.

## Fonctionnalités

**Implémenté**

- `/leaderboard` : liste unique, région dans l'URL (`?region=`), avatars (`avatarUrl`), rang Deadlock avec la couleur du back (`badge.color`, validée `#RRGGBB`), 3 héros au plus, pastilles « déduit » (`inferred`) et « non relié » (`steamId` null) avec explication (popover Base UI : survol, focus, toucher), ex æquo « = » dérivés des rangs de la source, couverture (`coverage`) en pied de liste, bandeau « rangs incomplets » (`meta.isPartial`), relecture toutes les 60 s seulement dans ce cas, aucun réessai automatique, skeletons à la géométrie des lignes, message après 3 s de chargement.
- `/search` : champ intégré (DoubleBezel lg, raccourci `/`), URL `?q=` source de vérité, validation à 300 ms (entrée d'historique remplacée, jamais empilée) ou avec Entrée, 2 caractères minimum, brouillon local adopté si l'URL change ailleurs (palette, retour arrière), résultats atténués tant que le brouillon n'est pas celui des résultats affichés, sections « Correspondance exacte », « Même pseudo · N comptes », « Pseudos proches ».
- SteamID64 (17 chiffres) : ouverture directe du profil (Entrée) ou ligne « Ouvrir ce profil », sans appel de recherche. Même règle que la palette, `STEAM_ID_RE` partagé.
- Récents : le système existant (`features/search/recents`). Un clic sur un résultat alimente les récents (vérifié par test).
- Palette : inchangée sauf la règle d'homonymes partagée (« même pseudo ») et `STEAM_ID_RE` importé.

**Conservé** : onglets Base UI, `RankBadge`, `HeroPortrait`, `Avatar`, `DataMetaNotice`, `ErrorState`, `EmptyState`, `Skeleton`, récents, query keys (`["leaderboard", region]`, `playerKeys.search`).

**Supprimé** : le podium, `EntryRank`, `PlayerRow` (plus de consommateur), le bandeau « pseudos proches » qui confondait proximité et homonymie.

**Écarté volontairement** : podium (variante B), préchargement des régions (quota), rang dans les résultats de recherche (non fourni), codes amis et URLs Steam (non pris en charge par `/players/search`), activation d'une région par les flèches du clavier (une requête à froid par flèche).

## UX

Direction retenue : **variante A, liste dense**. Même information que le podium, 10 lignes par écran à 390 px au lieu d'environ 2, une seule structure à maintenir, pas de troncature des pseudos du podium à 320 px. Le prototype comparatif A/B (desktop 1440, mobile 390 et 320, tous les états) est conservé comme référence : artefact Claude privé https://claude.ai/artifact/9W9jen6UgthUy6acz5QuwU (supprimé du dépôt, jamais intégré aux routes).

- Desktop (largeur utile du conteneur ≥ 640 px) : colonnes rang, joueur, rang Deadlock, héros, chevron. Mobile : rang, avatar, pseudo, rang sur la 2e ligne, 2 portraits. Moins de 300 px de conteneur (320 px d'écran) : portraits retirés, rang et pseudo conservés. Mise en page par container queries : la sidebar change la largeur utile sans changer celle de la fenêtre.
- Toute la ligne est un seul lien (lien étiré sur le pseudo), la pastille est au-dessus (z-10). Une ligne sans SteamID n'est pas un lien, n'a pas de chevron et ne réagit pas au survol.
- Mouvement : survol de fond, chevron de 2 px, fondu de 150 ms au changement de région. Pas de `scale` sur les lignes. `prefers-reduced-motion` respecté.

## Architecture

- `src/features/leaderboard/` : `model.ts` (`REGIONS`, `parseRegion`, `isTied`, `safeColor`), `LeaderboardRow.tsx`, `IdentityNote.tsx`, `hooks.ts` (`retry: false`, `refetchInterval` 60 s si `meta.isPartial`).
- `src/features/search/` : `model.ts` (`normalizeName` NFKC + espaces + casse, `groupResults`, `homonymKeys`, `matchParts`, constantes), `PlayerResultRow.tsx`, `HomonymGroup.tsx`, `SearchBox.tsx`.
- Pages : `LeaderboardPage.tsx`, `SearchPage.tsx`. Aucun nouvel appel réseau : `GET /leaderboard?region=` et `GET /players/search?q=` uniquement. Annulation des requêtes obsolètes par TanStack Query (signal), couverte par `searchData.test.tsx`.
- Aucun calcul métier ajouté : les ex æquo, les homonymes et la mise en valeur sont des transformations de présentation sur les champs du back.
- Mock : `leaderboard()` renvoie désormais des SteamID, des avatars (SVG en data URI), des ex æquo et des entrées non reliées, comme le back v1.14.0 (changement de données du mock, pas de DTO).

## Validation

- Typecheck, lint, build : OK. Vitest : 207 tests (183 avant), tous réussis. Nouveaux : modèle classement, modèle recherche, page classement (rangs, ex æquo, pastilles, URL, cache, 429 sans réessai, clavier), page recherche (homonymes, URL, débounce, Entrée, SteamID64, récents, vide, 429, indisponible, partiel, retour arrière).
- E2E Playwright (desktop et mobile) : 30 réussis, 4 ignorés (déjà ignorés en mobile), dont 5 nouveaux parcours dans `e2e/leaderboard-search.spec.ts` et `/leaderboard` ajouté au test de débordement.
- Données réelles : API de production (`/players/search?q=zephyr`, `/leaderboard?region=Oceania`, un seul appel à froid, 12,6 s) : schémas conformes à la v1.14.0, `coverage` présent, 4 entrées sans SteamID ni rang, 20 entrées `inferred` sur 43, un rang en double (41), certaines entrées avec 2 héros. Captures faites avec ces réponses réelles servies via Playwright. Les cas difficiles (homonymes, partiel, 429, chargement lent) viennent de fixtures, pas du back.
- Captures Chromium : classement et recherche à 1440, 768, 390 et 320 px, états normal, vide, 429, partiel, chargement lent, pseudos longs, sans avatar, sans SteamID, homonymes. Aucun débordement horizontal, hiérarchie et densité contrôlées à l'œil.

**Limites** : lecteur d'écran non testé (sémantique vérifiée par rôles et noms accessibles) ; zoom navigateur non testé ; l'indication de défilement des régions sur mobile est l'onglet coupé (pas de fondu) ; la police du navigateur de test n'a pas de glyphes CJK (pseudo en carrés dans les captures, pas dans un vrai navigateur) ; le message de chargement prolongé n'annonce pas de durée garantie (« peut prendre jusqu'à 10 s »).

## Suite

- Restant réel : rien de bloquant.
- Dette facultative : erreur React existante « deux enfants avec la clé `Mes suivis` » dans la navigation (hors périmètre, vue pendant les E2E) ; ancienne marque dans loader, favicon et image Open Graph ; tableaux de matchs défilant en horizontal sur mobile ; N+1 `GET /matches/:id` du profil.
- Pistes : grands groupes d'homonymes (20 comptes pour « Zephyr » en réel) à replier au-delà de quelques lignes ; rang dans la recherche seulement si le back l'ajoute.
