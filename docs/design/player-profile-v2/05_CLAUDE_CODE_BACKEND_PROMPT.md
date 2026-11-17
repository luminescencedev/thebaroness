# PROMPT CLAUDE CODE — BACKEND THE BARONESS / PLAYER PROFILE V2

Tu es Senior Backend Engineer et API Contract Architect. Tu travailles dans le dépôt **backend existant** `https://github.com/LilStick/thebaroness-back` (Express/TypeScript/Mongoose/Zod/Deadlock API). Tu collabores avec le frontend `https://github.com/luminescencedev/thebaroness` (branche `refonte-ui`). Ne recrée rien, ne touche pas au frontend depuis cette session, et **ne commit/push rien sans autorisation**.

## Objectif de cette session

Préparer et implémenter, en plusieurs étapes sûres, les **nouveaux contrats nécessaires au Player Profile V2**, sans casser l'API v1.8.0 existante. Ne développe pas maintenant les guildes ni les pages items/builds. Les items sont une phase ultérieure déjà documentée.

## Documents fournis à lire entièrement

- `02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md` : proposition détaillée, exemples, semantics, cas limites.
- `03_HANDOFF_APPEND_PROFILE_V2.md` : requêtes fonctionnelles frontend; l'ajouter au handoff front sera la responsabilité de l'agent frontend.
- `01_PLAYER_PROFILE_V2_SPEC.md` : architecture UX, périodes et données affichées.
- Backend local : `docs/HANDOFF.md`, `docs/openapi.yaml`, `CLAUDE.md`, `src/app.ts`, `src/modules/players/players.routes.ts`, `players.service.ts`, `src/modules/groups/group.compare.ts`, `src/modules/catalog/catalog.service.ts`, `src/integrations/deadlock/deadlock.api.ts`, `deadlock.schemas.ts`, `game-modes.ts`, `src/database/api-cache.ts`, `src/jobs/refresh-worker.ts`, `tests/players/players.routes.test.ts` et test d'OpenAPI.
- Front public : inspecte la branche `refonte-ui`, mais ne la modifie pas. Rappelle-toi que son contrat est en retard sur le back v1.8.0.

## Point de départ confirmé

Sur backend main inspecté au `228064057f899d5949e5a6df89e41c34abc17165` :
- `GET /api/players/:steamId`, `/matches?limit&cursor`, `/heroes` fonctionnent.
- `MatchSummary` et `MatchDetail` incluent déjà `matchMode` et `gameMode` ; les champs ne doivent pas être recréés.
- Le backend garde un historique normalisé dans `api_cache` avec TTL 3 minutes, et profils Steam 15 minutes; worker préchauffe les suivis et groupes.
- `toStoredMatches` conserve outcome 1/2 seulement; les issues non scorées/pénalisées sont exclues.
- `computeStats` somme actuellement K, D, A en comptant chacun des connus indépendamment : examiner les risques de mélange de couverture et harmoniser si nécessaire pour les nouveaux agrégats (sans changer silencieusement le sens de l'ancien contrat).
- La pagination actuelle est un curseur ordonné `startTime desc`, `matchId desc`. Le filtrage doit intervenir **avant** les limites et le curseur.
- `gameMode` représente la variante de jeu, `matchMode` le matchmaking. Ne jamais fusionner les deux.
- Le back contient `catalog.rankedSeasonStart()`; utiliser cette source au lieu de coder la date 2026-11-04 en dur dans une nouvelle route.

## Conventions essentielles

- Toutes les routes publiques du profil restent sans JWT; suivre/groupes restent privés.
- Ne casse aucun DTO existant, ni les clients déjà déployés. Paramètres additionnels optionnels et valeurs par défaut publiées. Versionner OpenAPI à chaque contrat livré.
- Les nombres inconnus sont `null`, pas `0`. Les données partielles et stale doivent être explicites via `DataMeta` et `coverage`.
- SteamID64 et matchId en string en front/back si identité; pas de conversion en nombre JS avec perte de précision.
- Appliquer les contrôles Zod, les erreurs existantes `400 INVALID_INPUT`, `404 NOT_FOUND`, `503 SERVICE_UNAVAILABLE` etc. Ne pas inventer une deuxième convention d'erreur.
- Pour nouvelles requêtes : réutiliser cache MongoDB normalisé par accountId, ne pas relancer Deadlock API à chaque changement de période ou filtre.
- Respecter rate limits upstream, `Retry-After`, bounded concurrency et stale-if-error.

## P0 — Contrats à implémenter en priorité

### 1. `GET /api/players/:steamId/overview`

Query `period=7d|30d|season`, `gameMode=all|normal|street_brawl`, `matchMode=all|ranked|unranked`.

Retourne sous une période exacte :
- `summary`: matches, wins, losses, WR, K/D/A totaux sur cas complets, KDA agrégé, taille échantillon KDA, avg net worth/min (+ sample), durée moyenne (+sample), dernière partie.
- `modes`: tableaux de combinaisons observées `gameMode` + `matchMode` avec W/L, winrate et échantillon.
- `topHeroes`: top 3 par volume avec hero ID, matches, W/L, WR, KDA et sample.
- `coverage`: période demandée et observée, effectifs, flags pour données partielles, inconnues.
- `meta`: DataMeta existante avec timestamps et isStale/isPartial.

**L'identité et le rang actuel restent dans `GET /players/:steamId`; ne duplique pas inutilement les données Steam.**

Important : calcul KDA sur **même sous-ensemble complet** `(K+A)/max(D,1)` ; pas de mélange de sommes calculées sur des matchs différents. Moyenne net worth/min sur matchs où `netWorth != null` et `durationSeconds > 0`; nommer exactement la formule.

### 2. Étendre `GET /api/players/:steamId/matches`

Préserver `limit=1..50`, `cursor`, retour `items`, `nextCursor`, `meta` ; ajouter optionnellement `period`, `gameMode`, `matchMode`, `heroId`, `outcome`.

- Sans nouveaux filtres : comportement v1.8 inchangé.
- Avec filtres : sélectionner **dans l'ensemble du cached history**, puis trier/paginer ; jamais filtrer la page déjà paginée.
- Faire respecter la cohérence curseur/filtres, y compris après changement de période. Documenter expiration/invalidité.
- Tester le cas de deux matchs avec même `startTime`, la précision des matchIDs, et absence de doublons.
- Les 0 résultats renvoient `items=[]`, pas 404 si le profil existe.
- Éviter tout nouveau fetch upstream par match en list view ; le détail enrichi est lazy à une étape suivante.

### 3. Étendre `GET /api/players/:steamId/heroes`

Ajouter optionnellement `period`, `gameMode`, `matchMode`. Conserver le contrat sans filtres. Ajouter uniquement les champs réellement défendables (losses, KDA sample, éventuels net/min avec sample).

## P1 — À proposer, puis implémenter selon accord et données

- Activité 12 semaines `/players/:steamId/activity` avec jours observés vs inconnus.
- `/players/:steamId/rank-history` basé sur badges réels, conversion `tier*10+subrank` vs score interne éventuel `tier*6+subrank`, sans MMR inventé. Consulter endpoint individuel `/v1/players/{account_id}/rank` pour la calibration, pas supposer que la série historique fournit tous les champs.
- Comparaison de période 20 vs 20 parties précédentes ; WR roulant défini après 10 parties.
- Coéquipiers/adversaires via endpoints mate/enemy ; ne pas affirmer 'Steam friends' ou 'même party' sans preuve.
- Enrichissement du détail de match avec achats d'items/participant stats si la source disponible le permet et que les schémas sont validés. Ne pas entraîner de fetch metadata N+1 pour l'historique.

## P2 — Futur catalogue Items / Builds (documenter uniquement)

Architecture à laisser dans roadmap : collection item normalisée/versionnée par patch/client version et langue anglaise, images, catégories, coûts, propriétés, pages `/items` et `/items/:id`, analytics filtrables à TTL plus court. Utiliser `api_cache` existant, garder les versions historiques et les liens itemId d'une partie, sans recharger tout le catalogue pour chaque match. Ne PAS implémenter ce gros chantier dans la phase Profile P0.

## Tests et documentation obligatoires

- Tests unitaires de stat calculations avec champs partiels, KDA sur cas complets, samples, null vs 0.
- Tests d'intégration pour périodes UTC/season, modes indépendants, filtres composés, tie/cursor, historique vide et invalide, cache stale et erreurs upstream.
- Vérifier perf/cache et limiter les requêtes externes, pas seulement tests avec fixtures parfaites.
- Ajouter les routes et nouveaux schémas **réellement implémentés** dans `docs/openapi.yaml`, augmenter la version, vérifier les tests de drift OpenAPI.
- Mettre à jour `docs/HANDOFF.md` du **backend** avec version livrée, SHA ou état Git, DTO, dépendances, limites connues et comportement réel. Garder l'historique du fichier.
- Lister clairement ce qui est fait, proposé, non fait ; ne pas prétendre que P1/P2 sont déjà disponibles.
- Exécuter `npm test`, lint, typecheck, build ou équivalents présents dans package.json ; rapporter honnêtement les résultats.

## Déroulement

1. Vérifier HEAD et `git status` ; préserver tous les changements existants, ne faire ni reset ni checkout destructeur.
2. Auditer les calculs et schémas actuels, écrire une courte décision de forme de DTO et stratégie de curseur.
3. Implémenter P0 de façon additive et testée avec données synthétiques ET au moins une vérification sur réponse/source réelle si les autorisations/environnement le permettent.
4. Mettre à jour OpenAPI, tests, handoff. Ne pas anticiper les clients front et ne pas pousser.
5. Produire une synthèse pour l'agent frontend : endpoints disponibles, formes exactes, exemple, erreurs, conventions de filtres, état de livraison et limites.

**Aucun commit/push sans autorisation.** Réussite = un backend compatible v1.8+ qui expose un Overview cohérent et de vrais filtres serveur, sans perdre les performances et le cache existants.
