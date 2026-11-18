# HANDOFF : front vers back

Fichier de liaison entre le Claude du front (`thebaroness`) et celui du back (`thebaroness-back`).
Il est mis à jour à chaque rapport du front. Le Claude du back le lit en premier : `git -C ../thebaroness pull` puis ce fichier.
Pendant côté back : `docs/HANDOFF.md` du back, lu par le front à chaque session.

Dernière mise à jour : 17/11/2026 (voir `git log -- docs/HANDOFF.md` pour le SHA). Branche front : `refonte-ui`. Back relu au commit `2280640` (`main` de `LilStick/thebaroness-back`, contrat OpenAPI **v1.8.0**).

## Profil joueur V2 : besoins et synchronisation des contrats (17/11/2026)

**Statut (17/11/2026, back `ebaabd2`, OpenAPI v1.11.0) : les phases P0 (v1.9.0), P1 (v1.10.0) et P2 (v1.11.0) du back sont livrées ; le profil utilise P0, P1 et les tendances de P2.** Pas encore utilisés côté front : `GET /items/stats`, `/items/{id}/stats`, `/heroes/{id}/builds`, `/heroes/{id}/item-pairs` (futures pages Items et Builds, chantier d'interface non démarré). Détail : `docs/design/player-profile-v2/INTEGRATION_V1_9_REPORT.md`.

**Pour le développeur back, lire dans cet ordre (branche `refonte-ui`, dossier `docs/design/player-profile-v2/`) :**

1. `docs/design/player-profile-v2/01_PLAYER_PROFILE_V2_SPEC.md` : la spécification produit et UX du profil, avec les données attendues par zone de l'écran.
2. `docs/design/player-profile-v2/02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md` : les contrats back proposés (endpoints, paramètres, DTO, exemples, cache, cas limites).
3. `docs/design/player-profile-v2/05_CLAUDE_CODE_BACKEND_PROMPT.md` : le prompt à donner au Claude du back pour implémenter ces contrats.
4. `docs/design/player-profile-v2/03_HANDOFF_APPEND_PROFILE_V2.md` : la version de référence de cette section.
5. Prototype de référence UX (données fictives, pas du code de production) : `docs/design/player-profile-v2/the-baroness-player-profile-v2.1.html`. Le prompt front : `docs/design/player-profile-v2/04_CLAUDE_CODE_FRONTEND_PROMPT.md`.

**Composition validée de `/players/:steamId` (dans le shell actuel, sans toucher à la landing ni à la sidebar) :** en-tête compétitif avec le **rang regroupé au pseudo** ; rail analytique à gauche (rang et modes, activité sur 12 semaines, héros les plus joués) ; colonne de droite avec les KPI, le graphique (KDA, taux de victoire, valeur nette par minute) et des **lignes de parties compactes de 64 à 72 px sur desktop** (76 à 88 px sur mobile).

### 1. Déjà livré par le back (vérifié le 17/11/2026), à ne pas redemander

| Sujet                                                                                          | Version             | État                                                                                                                                          |
| ---------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `matchMode` et `gameMode` dans `MatchSummary` et `MatchDetail`                                 | v1.7.0              | livré ; `gameMode` (format : `normal`, `street_brawl`...) et `matchMode` (type : `ranked`, `unranked`...) sont **deux dimensions distinctes** |
| `LeaderboardEntry.badge` rempli (95 entrées sur 100), `inferred`                               | v1.8.0              | livré                                                                                                                                         |
| 44 héros (Violet et Baba inclus), données de jeu en anglais, rangs et libellés                 | v1.4.1 et suivantes | livré                                                                                                                                         |
| Refresh forcé (`POST /players/:steamId/refresh`, `POST /groups/:id/refresh`)                   | v1.6.0              | livré                                                                                                                                         |
| Comparaison de groupe, routes P1 (classement, partie, héros d'un joueur, stats de méta)        | v1.3.0 et v1.4.0    | livré                                                                                                                                         |
| `GET /players/:steamId/matches` : `limit` (1 à 50) et `cursor`                                 | v1.8.0              | livré                                                                                                                                         |
| `GET /players/:steamId/overview`, filtres de `matches` et de `heroes`, champs de héros étendus | **v1.9.0**          | **livré et utilisé par le front** (voir section 2)                                                                                            |

Le front a recopié l'OpenAPI v1.8.0 (back `2280640`) dans `src/contracts/openapi.yaml` (ancienne copie : v1.6.0) et type `matchMode`, `gameMode` et `inferred` (`src/api/types.ts`), mocks alignés. Ce travail est dans l'arbre de travail de la branche `refonte-ui`, **non commité** à la date de cette section.

### 2. Demandes P0 : LIVRÉES en v1.9.0 (back `215075d`), branchées côté front

| Priorité | Évolution                                                                                               | Pourquoi                                                                                           | Contraintes                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| P0       | `GET /api/players/:steamId/overview?period=&gameMode=&matchMode=`                                       | KPI sur une période commune, rang et modes, héros les plus joués, couverture                       | réutiliser le cache d'historique ; `null` et tailles d'échantillon explicites                    |
| P0       | Étendre `GET /api/players/:steamId/matches` avec `period`, `gameMode`, `matchMode`, `heroId`, `outcome` | historique filtrable sur **toutes** les données, pas seulement les 200 parties chargées côté front | filtrer avant la pagination ; curseur cohérent avec les filtres ; rétrocompatible avec la v1.8.0 |
| P0       | Étendre `GET /api/players/:steamId/heroes` avec `period`, `gameMode`, `matchMode`                       | même période et mêmes modes dans l'aperçu et l'onglet héros                                        | ne pas mélanger carrière et 30 jours ; ne supprimer aucun champ                                  |

L'option `all` doit être supportée explicitement sur les nouveaux filtres.

**KDA agrégé :** `(somme K + somme A) / max(somme D, 1)` sur **les mêmes parties qui possèdent les trois valeurs**, avec la taille de l'échantillon. L'agrégat actuel de `players.service.ts` additionne K, D et A connus indépendamment : à vérifier et à harmoniser.

**Couverture :** dates demandées et observées, nombre de parties, `isPartial`, `isStale`, date de récupération. Une valeur inconnue n'est jamais 0.

### 3. Demandes P1 : LIVRÉES en v1.10.0 (sauf mention), branchées côté front

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

| #   | Demande                                                                     | État au 17/11/2026                                                                                   |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Mode de partie dans `MatchSummary`                                          | **livré** (v1.7.0, `matchMode` et `gameMode`)                                                        |
| 2   | Historique de rang d'un joueur seul, `GET /players/:steamId/rank-history`   | non livré : repris dans « Profil joueur V2 », P1                                                     |
| 3   | `limit` documenté et fenêtre d'historique plus large                        | **livré** (v1.9.0 : `period`, `gameMode`, `matchMode`, `heroId`, `outcome`, curseur lié aux filtres) |
| 4   | Dégâts, soins et objets dans le détail de partie                            | non livré : repris dans « Profil joueur V2 », P1                                                     |
| 5   | Rang du joueur dans le classement                                           | **livré** (v1.8.0)                                                                                   |
| 6   | Taux de victoire d'un joueur par héros avec période                         | **livré** (v1.9.0 : `heroes` avec `period`, `gameMode`, `matchMode`)                                 |
| 7   | Statistiques de méta de tous les héros en une requête (`GET /heroes/stats`) | non livré (absent de l'OpenAPI v1.8.0)                                                               |

## Journal des changements de contrat (du plus récent au plus ancien)

- 2026-11-18, finalisation Héros et Items (front, aucun changement de contrat, non commité) : filtre de coût remplacé par les montants exacts de `CatalogItem.cost` (jamais calculés depuis le tier), tri croissant et décroissant avec inconnus en dernier, `?cost=` dans l'URL, mocks de prix corrigés. **Vérifié contre le back réel `ebaabd2`** lancé en local (copie hors dépôt, MongoDB locale) : catalogue client 6861, 250 objets dont 173 en boutique, coûts 800 (23), 1 600 (43), 3 200 (46), 6 400 (44), 9 999 (17, tier V), tier et coût 1 pour 1, aucun coût ni nom null, pas de 2 400. Routes 200 : items, item, builds (4 tris), items/stats, items/:id/stats, item-pairs en 7 jours. **Écart** : `items/stats?period=30d` renvoie 503 (source 504 sur `item-stats`, repos de 120 s côté back, qui bloque aussi les requêtes 7 jours pendant ce délai) et `/ranks` a répondu 503 pendant les tests. Questions au back : (1) un repos par jeu de filtres plutôt que global ? (2) le défaut `period=30d` de `/items/stats` pourrait-il basculer sur 7 jours quand la source échoue ? Détail : `docs/design/heroes-items-sprint/` (`IMPLEMENTATION_REPORT.md`, `BACKEND_GAPS.md`).

- 2026-11-18, sprint Héros, Builds et Items (front, aucun changement de contrat, sur `main`, non commité) : le front consomme désormais les routes P2 de la v1.11.0 : `GET /items/stats`, `/items/{id}`, `/items/{id}/stats`, `/heroes/{id}/builds`, `/heroes/{id}/item-pairs`. Nouvelles pages `/items` et `/items/:itemId`, fiche héros réorganisée (onglets Aperçu, Capacités, Builds, Statistiques), catalogue héros avec filtres dans l'URL. Types corrigés : `CatalogItem.name`, `type`, `isActive` et `clientVersion` sont nullables comme dans l'OpenAPI. Un seul appel `GET /items?type=upgrade` partagé par toutes les pages, un seul appel `/items/stats` par jeu de filtres. **Non vérifié contre une instance du back** (Docker indisponible dans l'environnement) : validé sur l'OpenAPI et des mocks conformes. Questions non bloquantes : (1) `authorSteamId` des builds est-il un SteamID64 (lien vers le profil) ? (2) les items sous 20 parties sont-ils absents de `/items/stats` ? (3) un dénominateur `observedMatches` permettrait un vrai taux de choix d'item. Détail : `docs/design/heroes-items-sprint/` (`AUDIT.md`, `IMPLEMENTATION_REPORT.md`, `BACKEND_GAPS.md`).

- 2026-11-17, page partie V3 (front, aucun changement de contrat) : la page `/matches/:id` consomme `GET /matches/{id}` v1.11.0 et `GET /items?type=upgrade` (un seul appel mutualisé). Type front corrigé : `purchases[].atSeconds` et `abilityUpgrades[].atSeconds` sont `number | null` comme dans l'OpenAPI. Noms d'équipes affichés : `amber` = Hidden King, `sapphire` = Archmother (identifiants techniques inchangés). Révision : souls (valeur nette) en métrique principale, bouton retour et bouton global de sidebar côté front. Aucune demande au back à ce stade ; voir `docs/design/match-detail/IMPLEMENTATION_REPORT.md` pour les données absentes (rang individuel, économie minute par minute, momentum).

- 17/11/2026 : **Intégration du back v1.11.0 (phase P2) dans le front** (sur `main`, non commité). OpenAPI recopié (back `ebaabd2`, tout additif). Branché : `GET /players/:id/trends?size=` : la tendance « N dernières contre N précédentes » s'affiche sous la courbe de performance, avec `size` égal à la fenêtre 10 / 20 / 50 de la courbe et le format et le type du scope ; elle est **libellée « hors période »** car l'endpoint ignore `period` (tout l'historique). `previous: null` (`insufficient_history`) donne « Pas assez de parties pour comparer N contre N », jamais de comparaison inégale. Vérifié sur le Docker du back à `ebaabd2` (FunKa : +15,0 pts, KDA −0,77, Net/min −36 pour 20 contre 20, identique à l'exemple du back). Les ids d'objets de `/items/stats`, `/heroes/:id/builds` et `item-pairs` se résolvent avec le même `GET /items` déjà en cache : le front est prêt à construire les pages Items et Builds, mais **aucune interface n'a été créée** (décision produit à valider). Non utilisé : `rolling` de `/trends` (la courbe calcule son winrate glissant sur les parties du scope). Pas de question bloquante.

- 17/11/2026 : **Intégration du back v1.10.0 (phase P1) dans le front** (sur `main`, non commité). OpenAPI recopié (back `1805949`). Branchés : `GET /matches/:id` enrichi (`finalItemIds` résolus avec **un seul** `GET /items?type=upgrade` mis en cache 1 h, ordre du premier achat ; `killParticipation`, `mvpRank`, `stats` de fin de partie dont `heroCritRate` affiché comme HS « tirs critiques (tête) », `averageRankName` par équipe), `GET /players/:id/activity` (calendrier 12 semaines, suit `gameMode` et `matchMode` du scope, remplace le calcul local), `GET /players/:id/rank-history` (progression du rang dans le rail, `period` du scope, badges manquants comptés et non tracés), `GET /players/:id/relationships` (joués avec et contre, `normal` par défaut car la source n'a pas « tous les formats »). Le front ne charge plus que 50 parties pour la courbe (avant : jusqu'à 200 pour l'activité). Les champs v1.10 sont optionnels côté types : un back v1.9 (production avant son déploiement) donne « n/d » et des widgets vides, sans erreur bloquante. **Vérifié sur le Docker du back à `1805949`** (FunKa : build réel avec icônes, MVP, stats, activité, rang, coéquipiers, aucune erreur HTTP). Mock aligné sur ces formes (catalogue d'objets synthétique `/items`, activité, rang, relations). **Questions au back (non bloquantes)** : (1) `heroCritRate` est-il bien le pourcentage de tirs à la tête (équivalent HS) ? Le front l'affiche ainsi avec une infobulle explicite ; (2) `mvpRank` « sur 12 » suppose 12 joueurs : le total est-il toujours 12 ? (3) l'historique complet inclut maintenant les anciennes parties : les totaux de carrière du profil et des héros sans période ont augmenté, le front n'utilise que des périodes explicites donc aucun changement visible. Pas utilisés : `abilityUpgrades`, `purchases` (vente), `/items/{id}`, statistiques d'objets (non livrées).

- 17/11/2026 : **Intégration du back v1.9.0 dans le front** (non commité). `src/contracts/openapi.yaml` recopié (back `215075d`). Le profil utilise désormais `GET /players/:steamId/overview`, les filtres serveur de `/matches` (`period`, `gameMode`, `matchMode`, `heroId`, `outcome`) et ceux de `/heroes` (+ `losses`, `kdaSampleSize`, `avgNetWorthPerMinute`, `appliedFilters`). Un **scope unique** (période, format, type) vit dans l'URL (`?period=7d&gameMode=normal&matchMode=ranked`) et est **toujours envoyé explicitement** (le front n'utilise jamais le comportement « sans période » de `/matches` et `/heroes`). Les anciens calculs locaux (KPI, modes, filtres, héros) sont retirés du profil. Testé contre un back réel (copie locale du HEAD `215075d`, MongoDB en mémoire, vraies données Deadlock API, joueur FunKa) : agrégats `overview` = comptes paginés de `/matches` = somme de `/heroes` pour 7 jours, 30 jours, saison et les trois combinaisons de modes ; curseur réutilisé avec un autre filtre = 400. **Écarts et demandes (non bloquants)** : (1) le détail de partie réel ne contient toujours ni `items` ni `headshotPct` : le front les affiche « n/d » en production et les simule seulement en mode démo ; (2) `/matches` ne donne pas de total (ni `count`) : le front affiche « N parties chargées » et « d'autres sont disponibles » ; un `totalMatches` dans `MatchPage` permettrait un compteur exact ; (3) `/matches` n'accepte qu'un tri par date décroissante : le front a retiré les tris par KDA et durée de l'onglet Parties ; (4) pour la courbe et l'activité, le front lit l'historique du scope par pages de 50 (jusqu'à 200 parties) : `/activity` (P1) supprimerait ce chargement ; (5) chaque ligne de partie visible déclenche un `GET /matches/:id` (cache 10 min) pour CS, KP et équipes : un détail allégé par lot rendrait cela inutile. Aucun champ ni route inventé.

- 17/11/2026 : **Profil V2.2, lignes de partie enrichies (front, mocks).** Nouvelle demande P1 au back, jamais livrée : sur `MatchPlayer` (`GET /matches/:matchId`), deux champs **optionnels** que le front lit déjà s'ils existent : `items?: { itemId, name, tier (1-4), category (weapon|vitality|spirit), iconUrl }[]` (dans l'ordre d'achat, `itemId` stable pour de futures pages Items et Builds) et `headshotPct?: number|null` (0 à 100). Sans eux : « n/d », jamais 0. Déjà calculés côté front à partir de champs **réels** : derniers coups (`lastHits`) et par minute, participation aux éliminations (KP), position par valeur nette, deux distinctions explicables. Chargement : un `GET /matches/:matchId` par ligne, seulement quand la ligne approche de l'écran (≥ 768 px) ou est dépliée, mis en cache 10 min (clé `["matches", id]`). Si le back fournit un jour un détail plus léger ou un lot (`GET /matches?ids=`), cela évitera ces appels. En mode démo, MSW génère des builds synthétiques déterministes, signalés à l'écran. Aucun autre DTO modifié. Détails : `docs/design/player-profile-v2/IMPLEMENTATION_REPORT.md`.

- 17/11/2026 : **Profil joueur V2 implémenté côté front** (arbre de travail de `refonte-ui`, non commité). Contrat OpenAPI v1.8.0 recopié et typé (`matchMode`, `gameMode`, `inferred`). Le profil n'appelle **aucune** route proposée : il calcule tout (KPI, modes, activité, héros, graphique) localement à partir de `GET /players/:steamId/matches` (pages de 50 jusqu'à 200 parties), `GET /players/:steamId/heroes` et `GET /heroes/:id/stats`, et le dit à l'écran (« parties chargées », « historique partiel »). Les filtres de l'onglet Parties portent sur les parties chargées. Pour passer au filtrage serveur, le front attend les demandes P0 ci-dessus. Détails : `docs/design/player-profile-v2/IMPLEMENTATION_REPORT.md`.

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
