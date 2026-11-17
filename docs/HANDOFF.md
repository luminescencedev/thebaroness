# HANDOFF : front vers back

Fichier de liaison entre le Claude du front (`thebaroness`) et celui du back (`thebaroness-back`).
Il est mis à jour à chaque rapport du front. Le Claude du back le lit en premier : `git -C ../thebaroness pull` puis ce fichier.
Pendant côté back : `docs/HANDOFF.md` du back, lu par le front à chaque session.

Dernière mise à jour : 17/11/2026 (voir `git log -- docs/HANDOFF.md` pour le SHA). Branche front : `refonte-ui`. Back relu au commit `2280640` (`main` de `LilStick/thebaroness-back`, contrat OpenAPI **v1.8.0**).

## Profil joueur V2 : besoins et synchronisation des contrats (17/11/2026)

**Statut : les contrats ci-dessous sont PROPOSÉS, pas implémentés.** Aucune des routes ou des paramètres listés comme « proposés » n'existe dans le back (relevé le 17/11/2026 au commit back `2280640`, OpenAPI v1.8.0 : pas de `/players/{id}/overview`, `/activity` ni `/rank-history`, et `matches` et `heroes` n'ont aucun filtre de période, de mode, de héros ou de résultat). Le front les consomme derrière des adaptateurs clairement nommés « mock de contrat proposé » et affiche un état honnête « calculé sur les parties chargées » tant que le back ne les livre pas.

**Pour le développeur back, lire dans cet ordre (branche `refonte-ui`, dossier `docs/design/player-profile-v2/`) :**

1. `docs/design/player-profile-v2/01_PLAYER_PROFILE_V2_SPEC.md` : la spécification produit et UX du profil, avec les données attendues par zone de l'écran.
2. `docs/design/player-profile-v2/02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md` : les contrats back proposés (endpoints, paramètres, DTO, exemples, cache, cas limites).
3. `docs/design/player-profile-v2/05_CLAUDE_CODE_BACKEND_PROMPT.md` : le prompt à donner au Claude du back pour implémenter ces contrats.
4. `docs/design/player-profile-v2/03_HANDOFF_APPEND_PROFILE_V2.md` : la version de référence de cette section.
5. Prototype de référence UX (données fictives, pas du code de production) : `docs/design/player-profile-v2/the-baroness-player-profile-v2.1.html`. Le prompt front : `docs/design/player-profile-v2/04_CLAUDE_CODE_FRONTEND_PROMPT.md`.

**Composition validée de `/players/:steamId` (dans le shell actuel, sans toucher à la landing ni à la sidebar) :** en-tête compétitif avec le **rang regroupé au pseudo** ; rail analytique à gauche (rang et modes, activité sur 12 semaines, héros les plus joués) ; colonne de droite avec les KPI, le graphique (KDA, taux de victoire, valeur nette par minute) et des **lignes de parties compactes de 64 à 72 px sur desktop** (76 à 88 px sur mobile).

### 1. Déjà livré par le back (vérifié le 17/11/2026), à ne pas redemander

| Sujet                                                                                   | Version             | État                                                                                                                                          |
| --------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `matchMode` et `gameMode` dans `MatchSummary` et `MatchDetail`                          | v1.7.0              | livré ; `gameMode` (format : `normal`, `street_brawl`...) et `matchMode` (type : `ranked`, `unranked`...) sont **deux dimensions distinctes** |
| `LeaderboardEntry.badge` rempli (95 entrées sur 100), `inferred`                        | v1.8.0              | livré                                                                                                                                         |
| 44 héros (Violet et Baba inclus), données de jeu en anglais, rangs et libellés          | v1.4.1 et suivantes | livré                                                                                                                                         |
| Refresh forcé (`POST /players/:steamId/refresh`, `POST /groups/:id/refresh`)            | v1.6.0              | livré                                                                                                                                         |
| Comparaison de groupe, routes P1 (classement, partie, héros d'un joueur, stats de méta) | v1.3.0 et v1.4.0    | livré                                                                                                                                         |
| `GET /players/:steamId/matches` : `limit` (1 à 50) et `cursor`                          | v1.8.0              | livré, **sans filtre serveur**                                                                                                                |

Le front recopie l'OpenAPI v1.8.0 dans `src/contracts/openapi.yaml` (ancienne copie : v1.6.0) et type `matchMode`, `gameMode` et `inferred`. Ce travail est dans la branche `refonte-ui` mais **pas encore publié** à la date de cette section.

### 2. Demandes P0 PROPOSÉES (non livrées)

| Priorité | Évolution                                                                                               | Pourquoi                                                                                           | Contraintes                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| P0       | `GET /api/players/:steamId/overview?period=&gameMode=&matchMode=`                                       | KPI sur une période commune, rang et modes, héros les plus joués, couverture                       | réutiliser le cache d'historique ; `null` et tailles d'échantillon explicites                    |
| P0       | Étendre `GET /api/players/:steamId/matches` avec `period`, `gameMode`, `matchMode`, `heroId`, `outcome` | historique filtrable sur **toutes** les données, pas seulement les 200 parties chargées côté front | filtrer avant la pagination ; curseur cohérent avec les filtres ; rétrocompatible avec la v1.8.0 |
| P0       | Étendre `GET /api/players/:steamId/heroes` avec `period`, `gameMode`, `matchMode`                       | même période et mêmes modes dans l'aperçu et l'onglet héros                                        | ne pas mélanger carrière et 30 jours ; ne supprimer aucun champ                                  |

L'option `all` doit être supportée explicitement sur les nouveaux filtres.

**KDA agrégé :** `(somme K + somme A) / max(somme D, 1)` sur **les mêmes parties qui possèdent les trois valeurs**, avec la taille de l'échantillon. L'agrégat actuel de `players.service.ts` additionne K, D et A connus indépendamment : à vérifier et à harmoniser.

**Couverture :** dates demandées et observées, nombre de parties, `isPartial`, `isStale`, date de récupération. Une valeur inconnue n'est jamais 0.

### 3. Demandes P1 PROPOSÉES (après le socle P0)

- `GET /api/players/:steamId/activity?weeks=12&gameMode=&matchMode=` : calendrier sur 12 semaines, en distinguant « jour observé sans partie » et « jour non couvert ».
- `GET /api/players/:steamId/rank-history?period=` : rang observé sur de vraies parties classées (badge Valve `tier * 10 + subrank` converti en score ordonné `tier * 6 + subrank`), sans inventer de MMR, en tenant compte d'Eternus.
- Enrichissement additif de `PlayerRank` (placement, saison, progression) si la source individuelle le fournit de façon fiable.
- Tendances « 20 parties contre les 20 précédentes » avec les vrais effectifs.
- Joué avec et contre (coéquipiers et adversaires) sans confondre « même équipe » et « même groupe de matchmaking ».
- Enrichir `GET /api/matches/:matchId` (achats d'objets, dégâts, objectifs, participants) **seulement après validation de la source**, chargé à la demande.

### 4. P2 : catalogue d'objets et builds (backlog)

Catalogue d'objets normalisé et versionné (`GET /api/items`, `GET /api/items/:id`, statistiques d'objets, builds), cache par version du jeu et langue. Ne pas retarder le profil P0 pour ce chantier.

### 5. Livraison attendue côté back

1. Valider l'OpenAPI des nouveaux endpoints (exemples, champs nullable, erreurs, limites).
2. Implémentation et tests : pagination filtrée, couverture, zéro partie, données partielles, erreurs du fournisseur, modes, rang.
3. Mettre à jour `docs/HANDOFF.md` du back (routes livrées, version OpenAPI, SHA, décisions, écarts).
4. Transmettre au front les DTO et des fixtures de cas réels **anonymisés**.

## Fait : données de jeu en anglais (commit back `dfd5102`)

**Statut : livré par le back.** L'équipe a décidé que **toutes les données de jeu sont en anglais** : noms de héros, capacités, descriptions, histoire, rôles, tags, et **noms de rangs** (Obscurus, Initiate, Seeker, Acolyte, Sentinel, Mystic, Ritualist, Emissary, Oracle, Phantom, Ascendant, Eternus). Seule l'interface du front est en français.
Le back lit aujourd'hui les noms de rangs avec `language=french` (« Prosélyte », « Éternus 3 »). Merci de **retirer `language=french`** pour les rangs et le catalogue, et de renvoyer `"Eternus 3"`. Les fixtures du front sont déjà en anglais (`scripts/build-fixtures.mjs`, sans paramètre `language`).

## Réponses aux questions du back

- `LeaderboardEntry.badge` nullable : **oui**, le type du front est maintenant `... | null` et l'écran affiche « Rang non communiqué ».
- `MatchPlayer.displayName` avec repli sur le SteamID : **oui**, ça convient.
- `MatchDetail.playedAt` et `winningSide` nullables (openapi 1.3.0) : **gérés** (« Vainqueur inconnu », date « n/d »).
- Classement : `steamId` null si ambigu, `topHeroes` vide, ex aequo : **gérés** (pas de lien vers un profil, pas de portraits).
- Échelle du score de rang max 72 : commentaire corrigé dans `src/api/types.ts`.
- Compare : 503 si tout est indisponible, formule du KDA `(K + A) / max(D, 1)`, ordre de `GET /api/groups` par `updatedAt` décroissant : **le mock est aligné**.

## Ce que le front attend encore du back

Tout ce que le front consommait jusqu'ici est livré (voir le tableau « Déjà livré » plus haut). Ce qui reste attendu est uniquement dans les sections « Profil joueur V2 » (P0 et P1 proposés) et « Demandes au back » ci-dessous.

Contrat OpenAPI recopié dans `src/contracts/openapi.yaml` : v1.6.0 au dernier commit publié ; la v1.8.0 est en cours de recopie sur `refonte-ui`.

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
4. Production : front `https://thebaroness.4esport.fr`, back `https://api.thebaroness.4esport.fr` (déploiement Coolify, conteneurs `api`, `worker` et `mongodb`). Le front se build avec `VITE_API_BASE_URL=https://api.thebaroness.4esport.fr/api`.

## Fait : héros manquants dans le catalogue (issue back #71)

**Statut : livré** (44 héros, Violet et Baba inclus, vérifié en local le 16/11/2026). Historique de la demande : deux héros jouables n'apparaissaient pas dans `GET /api/heroes` : **Violet (id 86)** et **Baba (id 88)**. Dans Deadlock API ils ont `player_selectable: true`, `disabled: false`, `development_state: "release"` mais aussi `in_development: true` (héros récents). Le filtre de `src/modules/catalog/heroes.ts` (`!hero.in_development`) les écarte. Remplacer la condition par : `player_selectable && !disabled && development_state === 'release'` (sans tester `in_development`). Cela donne 44 héros ; les 21 autres (Kali, Gunslinger, Boss, etc.) ont `disabled: true` et restent exclus. Côté front, `scripts/build-fixtures.mjs` applique déjà cette règle (44 héros dans le mock).

Conséquence avant la correction : une partie jouée avec Violet ou Baba affichait « Héros #86 » sans portrait, et leur fiche répondait 404.

## Réponses aux demandes du back (HANDOFF back du 16/11/2026)

1. **Dockerfile** : corrigé (`ARG VITE_API_BASE_URL` sans valeur, `ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api}`), testé avec `docker build --build-arg VITE_API_BASE_URL=https://api.thebaroness.4esport.fr/api`. En-têtes de sécurité ajoutés dans `nginx.conf` (CSP avec `connect-src 'self' https://api.thebaroness.4esport.fr`, X-Frame-Options, Referrer-Policy, nosniff). Si le domaine de l'API change, adapter la CSP.
2. **Ajout par pseudo** : le formulaire de groupe cherche par pseudo (`players/search`, avatars et pseudos en puces), accepte aussi SteamID64, code ami, `[U:1:n]` et lien de profil (aucune validation `^\d{17}$` côté front, le message du 400 est affiché), avec le libellé « Pseudo, code ami, SteamID64 ou lien de profil Steam ».
3. **Actualiser** : déjà en place (profil et groupe, pause de 60 s, date `meta.fetchedAt`, alerte `isStale`). Relecture douce toutes les 3 min et au retour sur l'onglet sur le profil et la comparaison.
4. **Classement** : le back remplit désormais le rang (v1.7.0 et v1.8.0, 95 entrées sur 100, champ `inferred`). Le front a lu le rang sur le profil des 10 premiers en attendant ; cette lecture devient inutile. Les 5 entrées sans rang gardent « Rang non communiqué ».
5. OpenAPI : v1.6.0 recopié au commit `c406748` ; v1.8.0 (back `2280640`) en cours de recopie.

## Demandes au back (sans bloquer, le front s'en passe aujourd'hui)

| #   | Demande                                                                     | État au 17/11/2026                                                                                          |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Mode de partie dans `MatchSummary`                                          | **livré** (v1.7.0, `matchMode` et `gameMode`)                                                               |
| 2   | Historique de rang d'un joueur seul, `GET /players/:steamId/rank-history`   | non livré : repris dans « Profil joueur V2 », P1                                                            |
| 3   | `limit` documenté et fenêtre d'historique plus large                        | `limit` (1 à 50) et `cursor` documentés ; filtres serveur non livrés : repris dans « Profil joueur V2 », P0 |
| 4   | Dégâts, soins et objets dans le détail de partie                            | non livré : repris dans « Profil joueur V2 », P1                                                            |
| 5   | Rang du joueur dans le classement                                           | **livré** (v1.8.0)                                                                                          |
| 6   | Taux de victoire d'un joueur par héros avec période                         | non livré : repris dans « Profil joueur V2 », P0 (`heroes` avec `period`)                                   |
| 7   | Statistiques de méta de tous les héros en une requête (`GET /heroes/stats`) | non livré (absent de l'OpenAPI v1.8.0)                                                                      |

## Journal des changements de contrat (du plus récent au plus ancien)

- 17/11/2026 : pack **Profil joueur V2** publié (`docs/design/player-profile-v2/`, spécification, contrats back proposés, prompts). **Les nouveaux contrats sont proposés, pas implémentés.** HANDOFF réconcilié avec le back v1.8.0 : sections périmées marquées « fait » (anglais, héros manquants, tableau d'attente), statuts des demandes mis à jour. Aucun DTO ni route modifié par ce commit documentaire.

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
