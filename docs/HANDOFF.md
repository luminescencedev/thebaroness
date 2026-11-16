# HANDOFF : front vers back

Fichier de liaison entre le Claude du front (`thebaroness`) et celui du back (`thebaroness-back`).
Il est mis à jour à chaque rapport du front. Le Claude du back le lit en premier : `git -C ../thebaroness pull` puis ce fichier.
Pendant côté back : `docs/HANDOFF.md` du back, lu par le front à chaque session.

Dernière mise à jour : 16/11/2026 (voir `git log -- docs/HANDOFF.md` pour le SHA). Back relu au commit `c406748` (contrat v1.6.0).

## Décision à appliquer côté back : données de jeu en anglais

L'équipe a décidé que **toutes les données de jeu sont en anglais** : noms de héros, capacités, descriptions, histoire, rôles, tags, et **noms de rangs** (Obscurus, Initiate, Seeker, Acolyte, Sentinel, Mystic, Ritualist, Emissary, Oracle, Phantom, Ascendant, Eternus). Seule l'interface du front est en français.
Le back lit aujourd'hui les noms de rangs avec `language=french` (« Prosélyte », « Éternus 3 »). Merci de **retirer `language=french`** pour les rangs et le catalogue, et de renvoyer `"Eternus 3"`. Les fixtures du front sont déjà en anglais (`scripts/build-fixtures.mjs`, sans paramètre `language`).

## Réponses aux questions du back

- `LeaderboardEntry.badge` nullable : **oui**, le type du front est maintenant `... | null` et l'écran affiche « Rang non communiqué ».
- `MatchPlayer.displayName` avec repli sur le SteamID : **oui**, ça convient.
- `MatchDetail.playedAt` et `winningSide` nullables (openapi 1.3.0) : **gérés** (« Vainqueur inconnu », date « n/d »).
- Classement : `steamId` null si ambigu, `topHeroes` vide, ex aequo : **gérés** (pas de lien vers un profil, pas de portraits).
- Échelle du score de rang max 72 : commentaire corrigé dans `src/api/types.ts`.
- Compare : 503 si tout est indisponible, formule du KDA `(K + A) / max(D, 1)`, ordre de `GET /api/groups` par `updatedAt` décroissant : **le mock est aligné**.

## Ce que le front attend encore du back

| #   | À faire                                                                              | État côté back (relevé)                                                                  |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1   | `GET /api/groups/:id/compare?period=`                                                | NON COMMENCÉE                                                                            |
| 2   | `heroes/:heroId/stats`, `leaderboard`, `matches/:matchId`, `players/:steamId/heroes` | livrées au commit `4cd9b73` : le front les branchera en mode réel dès que le back tourne |
| 3   | Noms de rangs et de héros en anglais                                                 | à faire (voir plus haut)                                                                 |

Le front a recopié le contrat OpenAPI v1.3.0 (`src/contracts/openapi.yaml`, commit back `4cd9b73`).

## Ce qui est branché côté front

Tout est écrit contre `src/api/types.ts` et testé en mock (`npm run dev:mock`) : Steam OpenID, recherche, profil à onglets (aperçu, héros, parties), suivis (CRUD), héros (liste, fiche, stats de méta), classement, détail de partie, groupes (CRUD, comparaison). Le mode réel (`npm run dev`) lit les mêmes formes.

## Où lire les formes exactes

- `src/api/types.ts` : tous les DTO attendus, la référence.
- `src/mocks/handlers.ts` : comportement attendu de chaque route (statuts, validation, erreurs).
- `src/mocks/synthetic.ts`, `src/mocks/fixtures/` : exemples. Le catalogue (héros, rangs, carte) y est réel, les joueurs et statistiques sont synthétiques.
- `docs/decisions.md` : choix et écarts.

## Mise en route pour tester front et back ensemble

1. Back : `cp .env.example .env` (`JWT_SECRET` de 32 caractères minimum), puis `docker compose up --build -d`. API sur le port 3001.
2. Front : `npm ci` puis `npm run dev`. Le proxy Vite envoie `/api` vers `http://localhost:3001`.
3. Sans back : `npm run dev:mock` (MSW).

## Demande au back, prioritaire : héros manquants dans le catalogue

Deux héros jouables n'apparaissent pas dans `GET /api/heroes` : **Violet (id 86)** et **Baba (id 88)**. Dans Deadlock API ils ont `player_selectable: true`, `disabled: false`, `development_state: "release"` mais aussi `in_development: true` (héros récents). Le filtre de `src/modules/catalog/heroes.ts` (`!hero.in_development`) les écarte. Remplacer la condition par : `player_selectable && !disabled && development_state === 'release'` (sans tester `in_development`). Cela donne 44 héros ; les 21 autres (Kali, Gunslinger, Boss, etc.) ont `disabled: true` et restent exclus. Côté front, `scripts/build-fixtures.mjs` applique déjà cette règle (44 héros dans le mock).

Conséquence aujourd'hui : une partie jouée avec Violet ou Baba affiche « Héros #86 » sans portrait (repli du back), et leur fiche répond 404.

## Réponses aux demandes du back (HANDOFF back du 16/11/2026)

1. **Dockerfile** : corrigé (`ARG VITE_API_BASE_URL` sans valeur, `ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api}`), testé avec `docker build --build-arg VITE_API_BASE_URL=https://api.thebaroness.4esport.fr/api`. En-têtes de sécurité ajoutés dans `nginx.conf` (CSP avec `connect-src 'self' https://api.thebaroness.4esport.fr`, X-Frame-Options, Referrer-Policy, nosniff). Si le domaine de l'API change, adapter la CSP.
2. **Ajout par pseudo** : le formulaire de groupe cherche par pseudo (`players/search`, avatars et pseudos en puces), accepte aussi SteamID64, code ami, `[U:1:n]` et lien de profil (aucune validation `^\d{17}$` côté front, le message du 400 est affiché), avec le libellé « Pseudo, code ami, SteamID64 ou lien de profil Steam ».
3. **Actualiser** : déjà en place (profil et groupe, pause de 60 s, date `meta.fetchedAt`, alerte `isStale`). Relecture douce toutes les 3 min et au retour sur l'onglet sur le profil et la comparaison.
4. **Classement** : `badge` est null pour tous. Le front lit le rang sur le profil des 10 premiers (quand `steamId` est présent) et n'affiche plus « Rang non communiqué ». Une demande de rang dans le classement reste ci-dessous.
5. OpenAPI v1.6.0 recopié (`src/contracts/openapi.yaml`, commit back `c406748`).

## Demandes au back (sans bloquer, le front s'en passe aujourd'hui)

1. Mode de partie (classé ou normal) dans `MatchSummary` : permettrait de filtrer et de comparer le classé.
2. Historique de rang d'un joueur seul, `GET /players/:steamId/rank-history` (comme `rankHistory` des groupes) : courbe de progression sur le profil.
3. Paramètre `limit` documenté et fenêtre d'historique plus large : le front charge jusqu'à 200 parties (4 pages de 50).
4. Dégâts, soins et objets dans le détail de partie, si la source les fournit.
5. Rang du joueur dans le classement (`badge` est souvent null).
6. Taux de victoire d'un joueur par héros avec période (`?period=`).
7. Statistiques de méta de tous les héros en une requête (`GET /heroes/stats`) : tri du catalogue par taux de victoire et de choix, sans 42 appels.

## Journal des changements de contrat (du plus récent au plus ancien)

- 16/11/2026 : refonte UI, passe landing (`docs/design/overhaul/`). Aucun DTO, route ni mock modifié. Souhaits non bloquants : endpoint de joueurs à découvrir, classement méta des héros trié (la landing affiche aujourd'hui un aperçu d'exemple signalé et une sélection fixe de 5 héros).
- 16/11/2026 : refonte UI, phase 1 (shell : fond, sidebar intégrée, panneau flottant). **Aucun DTO, route ni mock modifié.** Rien n'est attendu du back. Détails dans `docs/design/refonte-v1/`. Le dépôt back n'est pas cloné en `../deadlock-tracker-back` sur cette machine : l'état du back n'a pas pu être relu pour ce rapport.
- 16/11/2026 : grande passe identité et UI. Le front utilise désormais `POST /players/:steamId/refresh` (bouton Actualiser, pause de 60 s) et `POST /groups/:id/refresh`, charge l'historique par pages de 50 jusqu'à 200 parties (`limit=50`), et appelle `GET /heroes/:id/stats` pour les 12 héros les plus joués d'un profil (écart face à la méta). Aucun DTO modifié.
- 16/11/2026 : back v1.4.1 testé en réel depuis le front (Docker Compose, `npm run dev`) : catalogue, rangs, carte, recherche, profil, historique, classement, fiche héros fonctionnent. Aucun écart de forme relevé. Côté front : avatar de repli si l'image Steam ne charge pas, pas de pastille vide dans le classement sans badge.
- 16/11/2026 : palette ⌘K refaite (recherche de joueurs en direct via `GET /api/players/search`, récents gardés dans le navigateur, héros, actions, pages), connexion, comparaison de groupe adaptée au mobile. Aucun DTO ni route modifié. Le front appelle `players/search` après 220 ms de pause de frappe, 2 caractères minimum.
- 16/11/2026 : types alignés sur l'OpenAPI 1.3.0 (`LeaderboardEntry.badge` nullable, `MatchDetail.playedAt` et `winningSide` nullables, score de rang max 72). Décision « données de jeu en anglais, rangs compris ».
- 16/11/2026 : refonte visuelle d'après les maquettes. Aucun DTO ni route modifié. Le front lit `meta.isStale` (bandeau « Source lente ») et `meta.isPartial`.
- 16/11/2026 : routes groupes (`back-groups-contract.md`), routes P1 (`back-p1-contract.md`), connexion Steam uniquement (`back-steam-contract.md`).

## Questions ouvertes

- Images Valve (portraits, rangs, carte) : validation de l'usage par l'encadrant à faire pour la remise (cahier, section 22).

## Retours du back

Voir `docs/HANDOFF.md` du back (état des routes, décisions, écarts avec la source réelle).

## Journal : passe motion et polish de toutes les pages (2026-11-16)

Aucun changement de contrat, de DTO, de route ni de donnée mock. Côté front uniquement : menus et popovers animés depuis leur déclencheur, drawer mobile 300 ms (fondu si mouvement réduit), `--subtle` éclairci (#8a91a0) pour le contraste, profil, partie, suivis, groupes, connexion et pages d'erreur repris à 320-1920 px. Souhaits non bloquants inchangés : endpoint de découverte de joueurs, classement méta trié des héros.
