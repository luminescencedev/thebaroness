# À AJOUTER dans `thebaroness/docs/HANDOFF.md`

> **Mode d'intégration :** ajouter cette section **sans remplacer ni supprimer** les autres entrées du handoff. Vérifier les modifications intervenues depuis le 17/11/2026 et réconcilier les statuts existants. Ce texte est une **proposition de demande**, pas une confirmation d'implémentation. Ne pas modifier le backend depuis le repo frontend.

## 2026-11-17 — Profil joueur V2 : besoins et synchronisation des contrats

**Contexte UX validé :** nouvelle composition de `/players/:steamId` dans le shell actuel (sans refondre landing ni sidebar), header compétitif avec **rang regroupé au pseudo**, rail analytique gauche (rang/modes, activité 12 semaines, top héros), colonne droite (KPI + graphe KDA/WR/net-min et **lignes de matchs compactes 64–72 px desktop / 76–88 px mobile**). L'historique riche utilise de vrais items/participants uniquement lorsque la donnée est disponible. Description exhaustive : `docs/design/player-profile-v2/PRODUCT_SPEC.md` côté front.

### 1. Réconciliation préalable obligatoire : le back a déjà livré v1.8.0

Backend public : `https://github.com/LilStick/thebaroness-back`, `main` inspecté au `228064057f899d5949e5a6df89e41c34abc17165` ; source de vérité `docs/openapi.yaml` **v1.8.0**. Le front `refonte-ui` inspecté au `84de6a49cf3ec2e607fc892a35145272520516cd` possède encore le contrat OpenAPI **v1.6.0**. À traiter côté front avant la refonte du profil :

- Aligner `src/contracts/openapi.yaml` sur `thebaroness-back/docs/openapi.yaml` v1.8.0, en vérifiant les diff et en conservant les autres changements non liés.
- Typage frontend `MatchSummary` et `MatchDetail` : champs `matchMode`, `gameMode` **déjà livrés** (v1.7.0). Ne pas les redemander au backend.
- `LeaderboardEntry.inferred` + badge enrichi **déjà livrés** (v1.8.0). Adapter les usages, fixtures et tests.
- Les 44 héros incluant Violet/Baba, rangs et libellés anglais, routes P1 et comparaison de groupes **déjà livrés selon le handoff back**. Mettre à jour les anciennes demandes périmées du handoff front après validation, sans effacer l'historique utile.
- `GET /players/:steamId/matches` existe mais **ne filtre pas encore côté serveur** sur les périodes, héros, modes et résultats ; il gère `limit`/`cursor` (1 à 50).

### 2. Nouvelles demandes P0 à LilStick (PROPOSÉES, PAS LIVRÉES)

| Priorité | Évolution | Pourquoi | Contraintes |
|---|---|---|---|
| P0 | `GET /api/players/:steamId/overview?period=&gameMode=&matchMode=` | KPI sur une période commune, rang/modes, top héros, couverture | Réutiliser le cache d'historique, normaliser éligibilité, `null` et tailles d'échantillon |
| P0 | Étendre `GET /api/players/:steamId/matches` avec `period`, `gameMode`, `matchMode`, `heroId`, `outcome` | Historique filtrable sur **toutes les données**, pas seulement 200 matchs chargés côté front | Filtrer avant pagination, curseur cohérent avec filtres, rétrocompatibilité v1.8.0 |
| P0 | Étendre `GET /api/players/:steamId/heroes` avec `period`, `gameMode`, `matchMode` | Même période et modes dans aperçu et héros | Éviter de mélanger carrière/30 jours ; pas de suppression de champs |

**Dimensions distinctes :** `gameMode` (format du jeu : `normal`, `street_brawl`) != `matchMode` (type de matchmaking : `ranked`, `unranked`). L'option `all` doit être explicitement supportée sur les nouveaux filtres.

**KDA agrégé :** calculer `(sum(K)+sum(A))/max(sum(D),1)` sur **les mêmes matchs possédant les trois valeurs** ; renvoyer taille de l'échantillon. L'agrégat actuel dans `players.service.ts` accumule K/D/A connus indépendamment ; à vérifier et harmoniser pour V2.

**Coverage:** inclure dates demandées/observées, nombre de matchs, `isPartial`, `isStale`, date de récupération. Ne jamais afficher un ratio inconnu comme 0.

### 3. Demandes P1, après le socle P0

- `GET /api/players/:steamId/activity?weeks=12&gameMode=&matchMode=` : heatmap sur 12 semaines, avec contrôle de couverture (jour observé sans matchs vs jour non couvert).
- `GET /api/players/:steamId/rank-history?period=` : rang observé sur vrais matchs classés, conversion testée `tier*10+subrank` (badge Valve) vers score ordonné éventuel `tier*6+subrank`. Ne pas inventer de MMR ; tenir compte d'Eternus.
- Enrichissement additif `PlayerRank` : placement/calibration, saison, progression si la source individuelle `/v1/players/{account_id}/rank` fournit ces valeurs et que leur fiabilité est établie.
- Tendances `20 matchs vs 20 précédents` / comparaisons honnêtes avec vrais effectifs, pas de score opaque.
- Played With / Against via endpoints de coéquipiers/adversaires en ne confondant pas 'même équipe' et 'même groupe de matchmaking'.
- Enrichir `GET /api/matches/:matchId` avec achats d'items, éventuelle composition du build, dommages/objectifs et participants **uniquement après validation de la source**. Charger les détails à la demande, pas pour toutes les lignes historiques.

### 4. P2 — futur catalogue Items / Builds (à garder au backlog)

Créer un catalogue item normalisé/versionné (id, nom anglais, image, coût, tier, catégorie, propriétés, version de patch), fondé sur les endpoints assets de Deadlock API et cache MongoDB existant. Prévoir `GET /api/items`, `GET /api/items/:id`, statistiques d'items et builds dans une phase ultérieure. Cache catalogue par **version du jeu** et langue ; analytics par filtres et fraîcheur distincte. Ne pas retarder le profil P0 pour ce chantier.

### 5. Livraison attendue côté back

1. Proposer/valider l'OpenAPI des nouveaux endpoints, avec exemples valides, champs nullable, erreurs et limites.
2. Livrer implémentation + tests (pagination filtrée, data coverage, 0 match, données partielles, erreurs fournisseur, modes, rang).
3. Mettre à jour `thebaroness-back/docs/HANDOFF.md` : routes livrées, version OpenAPI, SHA Git, décisions et éventuels écarts.
4. Communiquer au front les nouveaux DTO et des fixtures de cas réels **anonymisés**, sans données privées et sans secrets.

**Spécification exhaustive fournie séparément :** `02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md` (à transmettre au backend lors de la revue), les besoins peuvent être renumérotés selon la roadmap commune.
