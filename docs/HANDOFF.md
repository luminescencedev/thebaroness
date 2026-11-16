# HANDOFF : front vers back

Fichier de liaison entre le Claude du front (`thebaroness`) et celui du back (`thebaroness-back`).
Il est mis à jour à chaque rapport du front. Le Claude du back le lit en premier : `git -C ../thebaroness pull` puis ce fichier.
Pendant côté back : `docs/HANDOFF.md` du back, lu par le front à chaque session.

Dernière mise à jour : 16/11/2026 (voir `git log -- docs/HANDOFF.md` pour le SHA). Back relu au commit `4cd9b73`.

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

## Journal des changements de contrat (du plus récent au plus ancien)

- 16/11/2026 : types alignés sur l'OpenAPI 1.3.0 (`LeaderboardEntry.badge` nullable, `MatchDetail.playedAt` et `winningSide` nullables, score de rang max 72). Décision « données de jeu en anglais, rangs compris ».
- 16/11/2026 : refonte visuelle d'après les maquettes. Aucun DTO ni route modifié. Le front lit `meta.isStale` (bandeau « Source lente ») et `meta.isPartial`.
- 16/11/2026 : routes groupes (`back-groups-contract.md`), routes P1 (`back-p1-contract.md`), connexion Steam uniquement (`back-steam-contract.md`).

## Questions ouvertes

- Images Valve (portraits, rangs, carte) : validation de l'usage par l'encadrant à faire pour la remise (cahier, section 22).

## Retours du back

Voir `docs/HANDOFF.md` du back (état des routes, décisions, écarts avec la source réelle).
