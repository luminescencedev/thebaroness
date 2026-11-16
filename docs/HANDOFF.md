# HANDOFF : front vers back

Fichier de liaison entre le Claude du front (`thebaroness`) et celui du back (`deadlock-tracker-back`).
Il est mis à jour à chaque rapport du front. Le Claude du back le lit en premier : `git -C ../thebaroness pull` puis ce fichier.
Pour répondre ou demander quelque chose, ton utilisateur l'écrit dans la section « Retours du back » ou le dit au Claude du front.

Dernière mise à jour : 16/11/2026 (voir `git log -- docs/HANDOFF.md` pour le SHA).

## Ce que le front attend du back, par priorité

| #   | À faire                                                                                                                                                                | Contrat                   | État côté back                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------- |
| 1   | `GET /api/heroes`, `GET /api/heroes/:heroId`, `GET /api/ranks`, `GET /api/map` (catalogue, images, textes en anglais : ne pas passer `language=french` à Deadlock API) | `back-p1-contract.md`     | NON COMMENCÉE (issues #19 à #23) |
| 2   | `rank` détaillé dans le profil : `tier`, `subrank`, `imageUrl`, `color` en plus de `badgeId` et `name`. Aujourd'hui `{ badgeId: null, name: null }`                    | `back-p1-contract.md`     | à faire                          |
| 3   | `heroImageUrl` dans `MatchSummary`                                                                                                                                     | `back-p1-contract.md`     | à faire                          |
| 4   | `GET /api/leaderboard?region=`, `GET /api/matches/:matchId`, `GET /api/players/:steamId/heroes`, `GET /api/heroes/:heroId/stats`                                       | `back-p1-contract.md`     | NON COMMENCÉE                    |
| 5   | Groupes : CRUD `/api/groups` et `GET /api/groups/:id/compare?period=`                                                                                                  | `back-groups-contract.md` | à faire                          |

Ordre conseillé : 1 à 3 d'abord (la landing, les profils et les parties en dépendent), puis 4, puis 5.

## Ce qui est déjà aligné

Steam OpenID, `/auth/me`, recherche, profil, historique paginé, CRUD des suivis, erreurs, CORS : le front est branché sur ces formes (copie figée du contrat dans `src/contracts/openapi.yaml`, commit back `7f88585`). `player.region` est un code pays (`FR`) : le front le convertit en nom.

## Où lire les formes exactes

- `src/api/types.ts` : tous les DTO attendus, la référence.
- `src/mocks/handlers.ts` : comportement attendu de chaque route (statuts, validation, erreurs).
- `src/mocks/synthetic.ts`, `src/mocks/fixtures/` : exemples de réponses. Le catalogue (héros, rangs, carte) y est réel (Deadlock API, français), les joueurs et statistiques sont synthétiques.
- `docs/decisions.md` : choix et écarts.

## Mise en route pour tester front et back ensemble

1. Back : `.env` avec `MONGODB_URI`, `JWT_SECRET` (32 caractères minimum), `API_PUBLIC_URL=http://localhost:3001`, `FRONT_URL=http://localhost:5173`, `CORS_ORIGIN=http://localhost:5173`, `JWT_EXPIRES_IN=1h`. Lancer Mongo et l'API (Docker Compose, voir le README du back). L'API écoute sur le port 3001.
2. Front : `npm ci` puis `npm run dev`. Le proxy Vite envoie `/api` vers `http://localhost:3001`.
3. Sans back : `npm run dev:mock` (MSW), toutes les pages fonctionnent avec des données de démonstration.

## Journal des changements de contrat (du plus récent au plus ancien)

- 16/11/2026 : toutes les données de jeu sont en anglais (héros, capacités, lore, rangs, rôles). L'interface reste en français. Aucun changement de forme.
- 16/11/2026 : ajout des routes groupes (`back-groups-contract.md`).
- 16/11/2026 : ajout des routes P1 catalogue, classement, partie (`back-p1-contract.md`).
- 16/11/2026 : connexion Steam uniquement (`back-steam-contract.md`), implémentée par le back.

## Questions ouvertes

- Rang détaillé : le back peut-il fournir `tier` et `subrank` à partir de `ranked_display_badge` (historique de parties) ? Sinon le profil reste « Non classé ».
- Historique de rang pour les groupes : historique de parties (`ranked_delta`) ou snapshots du back (`player_snapshots`) ?
- Images Valve (portraits, rangs) : validation de l'usage à faire pour la remise (cahier, section 22).

## Retours du back

_(à remplir : date, point traité, SHA du back, écarts éventuels par rapport aux contrats)_
