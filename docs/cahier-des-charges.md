# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE
## Deadlock Tracker — Projet Full Stack JS (EFREI M1)

**Version :** 1.0 — cadrage du 16 novembre 2026  
**Statut :** Spécification proposée ; arbitrages pédagogiques signalés dans la section 2  
**Sources pédagogiques :** *LIVRET ETUDIANT V2.pdf* (15 pages, version de travail du 24/09/2026) ; *ORAL DevFullStack.pdf* (3 pages)  
**Référence externe :** Deadlock API, https://api.deadlock-api.com/docs/ — à revalider au moment de l'intégration.

## 1. Objet du document

Le présent cahier des charges définit le périmètre, les parcours, les exigences fonctionnelles et non fonctionnelles, l'architecture, le contrat d'API, le modèle de données, la qualité, les tests, les critères de recette et les livrables d'un site web de suivi statistique du jeu Deadlock. Il vise à fournir une référence commune de développement et de soutenance, afin qu'un tiers puisse installer, exécuter, tester et comprendre l'application.

Il distingue : **MVP pédagogique (P0)**, requis pour montrer une application full stack de bout en bout ; **version enrichie (P1)**, à entreprendre après le MVP ; **évolutions (P2)**, hors périmètre des 28 heures. Les caractéristiques des API tierces sont indicatives tant que les contrats et les réponses réelles ne sont pas validés par des tests d'intégration.

## 2. Hypothèses, décisions et écarts aux documents EFREI

| Point | Choix du projet | Exigence relevée | Statut / mesure |
|---|---|---|---|
| Sujet | Deadlock Tracker | Livret : catalogue fermé TaskFlow / HabitLab / BudgetFlow | Choix fixé pour l'équipe ; autorisation pédagogique à confirmer, car le livret ne reconnaît pas ce quatrième sujet (livret pp. 1–3, 15). |
| Frontend | React + Vite + TypeScript | React, Vite conseillé ; langage JavaScript | React conforme ; validation de TypeScript à obtenir (livret p. 2). |
| Backend | Node.js + Express + TypeScript | Express obligatoire et explicitement non substituable | Framework Express conforme au livret. Le seul point de validation technique restant ici est TypeScript. |
| Base de données | MongoDB + Mongoose | MongoDB + Mongoose | Conforme. |
| Architecture Git | Deux repositories : front et back | Livret : dépôt individuel unique contenant les deux couches | Dérogation à confirmer ; fournir les deux liens, SHAs, et une procédure de clonage (livret pp. 10, 13). |
| Organisation | Travail d'équipe | Livret : individuel ; oral : groupe | Appliquer la consigne du formateur la plus récente ; prévoir contributions individuelles tracées (oral pp. 1–3). |
| Authentification | Email / mot de passe / JWT Bearer | bcrypt, JWT, séparation des comptes | Implémentation obligatoire pour le MVP. |
| Tests | Jest + Supertest | Jest + Supertest | Conserver les deux, même si Express exige un adaptateur de test HTTP. |
| Documentation | README et OpenAPI | README, .env.example, Swagger/OpenAPI | Conserver. |
| Déploiement | Docker et Docker Compose | Déploiement cloud non confirmé | Docker obligatoire pour le projet ; URL publique seulement si demandé. |

**Point bloquant pédagogique :** un CRUD personnalisé `/api/tracked-players` satisfait l'objectif d'apprentissage du CRUD privé, mais ne satisfait pas littéralement les chemins `/api/tasks`, `/api/habits` ou `/api/transactions` du catalogue. Il faut obtenir un contrat adapté au sujet Deadlock. N'ajoutons pas de fausses routes TaskFlow uniquement pour masquer cette divergence.

**Règle d'arbitrage :** en l'absence de validation, l'architecture voulue est un objectif de projet et non une conformité démontrée au livret. Le document d'oral impose 10 minutes par groupe et un barème 6/5/4/2/3 ; le livret évoque un oral individuel et un barème proposé. Retenir le document d'oral comme format de préparation pratique, sans prétendre résoudre cette contradiction administrative.

## 3. Vision produit et utilisateurs

**Produit :** application web de suivi des performances de joueurs Deadlock, combinant consultation publique des statistiques et espace personnel sécurisé de suivi de joueurs.

**Problème :** les informations d'un joueur, les matchs, les rangs et les statistiques par héros sont répartis entre plusieurs ressources ; une interface cohérente doit les rendre accessibles depuis un point de recherche unique, tout en laissant chaque utilisateur organiser les profils qu'il souhaite consulter régulièrement.

**Publics :** (1) visiteur souhaitant rechercher un joueur et consulter son profil ; (2) joueur authentifié souhaitant conserver une liste personnelle de profils suivis ; (3) utilisateur avancé souhaitant explorer les statistiques de matchs et de héros ; (4) évaluateur souhaitant démontrer les trois couches et les droits d'accès.

**Valeur du MVP :** recherche publique, fiche joueur claire, historique disponible, espace privé CRUD réellement persistant et sécurisé. Aucun compte Steam, authentification tierce, service temps réel ou extraction de replay n'est requis pour le MVP.

## 4. Périmètre et priorisation

| Niveau | Fonctionnalités incluses | Condition de sortie |
|---|---|---|
| P0 — MVP soutenable | Santé API ; inscription ; connexion ; JWT ; recherche de joueurs ; fiche joueur ; aperçu des matchs ; liste de joueurs suivis ; création, lecture, modification et suppression d'un suivi ; MongoDB ; isolation A/B ; erreurs ; responsive ; tests ; README ; OpenAPI ; Docker | Parcours démontrable intégral, données persistantes, tests nominaux et négatifs réussis. |
| P1 — Produit enrichi | Rang détaillé ; statistiques par héros ; détail du match ; filtres ; leaderboard ; catalogue des héros ; favoris de builds ; graphiques de progression ; cache perfectionné | Ne commence qu'après P0 stabilisé. |
| P2 — Évolutions futures | Matchups, counters, synergies, comparaison de joueurs, progression historique via snapshots, builds personnalisés, analyse de replays, live, carte et timeline détaillée | Hors MVP et hors promesse des 28 h. |

**Exclusions P0 :** collecte native de données de jeu, overlays, Steam OpenID, synchronisation permanente, notifications, paiement, IA, analyse prédictive, édition de données de match tierces.

## 5. Parcours utilisateurs attendus

### PU-01 — Recherche publique

1. Le visiteur ouvre l'accueil. 2. Il saisit un pseudo ou identifiant Steam. 3. Le système interroge notre backend, qui appelle Deadlock API ou un cache. 4. La liste de résultats affiche nom, avatar si disponible et identifiant. 5. Le visiteur ouvre le profil. 6. Il consulte les statistiques principales et l'historique disponible. **Cas alternatifs :** aucun résultat ; données temporaires indisponibles ; plusieurs comptes semblables ; match historique incomplet.

### PU-02 — Compte et session

1. Le visiteur crée un compte email/mot de passe. 2. Le serveur valide, hache et stocke le mot de passe. 3. Il renvoie un utilisateur public et un JWT signé. 4. L'utilisateur accède à son espace personnel. 5. Une requête sans jeton, ou avec un jeton expiré, échoue avec 401. **Cas alternatifs :** email invalide ; mot de passe trop court ; email déjà utilisé ; identifiants refusés.

### PU-03 — CRUD « Mes joueurs suivis »

1. L'utilisateur authentifié recherche un joueur. 2. Il choisit « Suivre ». 3. Un enregistrement MongoDB est créé avec `ownerId` issu du JWT, `steamId`, un alias, une note et des tags. 4. La page « Mes suivis » liste uniquement ses enregistrements. 5. Il ouvre un suivi, modifie alias/note/tags, puis supprime le suivi avec confirmation. 6. Après redémarrage de l'API, les suivis non supprimés existent toujours. **Cas sécurité :** le compte B ne peut lire, modifier ni supprimer les suivis de A même en connaissant leur identifiant.

### PU-04 — Démonstration de soutenance

Compte A : inscription → connexion → recherche → suivi créé → modification → rechargement → lecture ; compte B : authentification → tentative GET/PATCH/DELETE de l'objet A → 404 ; retour à A : suppression → 204 ; montrer un test automatisé, la documentation et Docker.

## 6. Exigences fonctionnelles détaillées

| ID | Priorité | Exigence | Critère d'acceptation |
|---|---|---|---|
| F-01 | P0 | Accueil avec recherche visible | La recherche est utilisable sans compte. |
| F-02 | P0 | Recherche de joueur via le backend | Résultats compréhensibles ; gestion du zéro résultat. |
| F-03 | P0 | Fiche publique du joueur | Identifiant, pseudo/avatar si disponibles, stats explicites. |
| F-04 | P0 | Liste de matchs récents | Résultat, héros, date, durée si fournis ; données absentes signalées. |
| F-05 | P0 | Inscription email/mot de passe | 201, `user` et JWT ; bcrypt côté serveur. |
| F-06 | P0 | Connexion | 200, JWT valide ; refus uniforme en 401. |
| F-07 | P0 | Gestion d'une session | Bearer envoyé sur les routes privées ; état expiré traité. |
| F-08 | P0 | Créer un suivi personnel | 201 ; propriétaire calculé depuis le JWT. |
| F-09 | P0 | Lister les suivis personnels | 200, `{ "items": [] }` si vide ; zéro fuite inter-comptes. |
| F-10 | P0 | Consulter un suivi | 200 pour son objet ; 404 pour celui d'autrui. |
| F-11 | P0 | Modifier un suivi partiellement | PATCH non vide, champs autorisés, 200 ; persistance effective. |
| F-12 | P0 | Supprimer un suivi | DELETE 204 sans corps ; GET ultérieur 404. |
| F-13 | P0 | Valider les entrées | 400 sur champ interdit, valeur invalide ou identifiant malformé. |
| F-14 | P0 | Formulaires et états UI | Chargement, erreurs, confirmation de suppression et succès lisibles. |
| F-15 | P0 | Santé serveur | `GET /api/health` → 200, exactement `{ "status": "ok" }`. |
| F-16 | P1 | Statistiques détaillées par héros | Filtres et nombre de parties disponibles. |
| F-17 | P1 | Détails d'un match | Teams / KDA / build selon champs fournis. |
| F-18 | P1 | Classement et rang | Origine et date des données explicites. |
| F-19 | P1 | Liste des héros et statistiques méta | Pagination/filtres, source indiquée. |
| F-20 | P1 | Graphiques de progression | Méthodologie de calcul documentée, données partielles visibles. |
| F-21 | P2 | Comparaison de joueurs | Mêmes filtres et dénominateurs entre profils. |
| F-22 | P2 | Analyse de match avancée | Replays traités de manière asynchrone ; résultats traçables. |

## 7. Règles de données et validation métier

### 7.1 Comptes

- `email` obligatoire, syntaxe email, stocké et comparé en minuscules après normalisation ; index unique.
- `password` obligatoire, chaîne d'au moins 8 caractères ; en base, seul `passwordHash` bcrypt est enregistré.
- `id` exposé sous forme de chaîne ObjectId ; aucun hash ou champ secret dans une réponse.
- JWT signé avec clé serveur provenant de `JWT_SECRET`, expiration configurée et contrôlée.

### 7.2 Suivis personnels (`tracked_players`)

| Champ API | Type | Création | Modification | Règles |
|---|---|---|---|---|
| `steamId` | string | requis | interdit | Identifiant SteamID64 numérique de 17 chiffres canonisé ; clé immuable après création. |
| `alias` | string | facultatif | autorisé | 0–80 caractères après trim ; chaîne vide autorisée. |
| `note` | string | facultatif | autorisé | 0–1000 caractères ; chaîne vide autorisée. |
| `tags` | string[] | facultatif | autorisé | Maximum 10 tags uniques, chacun de 1–24 caractères après trim. |
| `id` | string | généré | interdit | ObjectId sérialisé, jamais accepté en POST/PATCH. |
| `ownerId` | ObjectId | calculé serveur | interdit | Obtenu exclusivement depuis le JWT validé ; jamais fourni par le client. |
| `createdAt`, `updatedAt` | ISO date | générés | interdits | Timestamps serveur en UTC. |

Les identifiants Deadlock/Steam ne doivent pas être convertis aveuglément en `Number` JS si leur valeur sort des entiers sûrs. Le backend conserve `steamId` en chaîne et utilise l'identifiant adapté à chaque endpoint externe.

**Unicité :** index MongoDB unique `{ ownerId: 1, steamId: 1 }`, afin qu'un même utilisateur n'ajoute pas deux fois le même joueur. Deux utilisateurs différents peuvent suivre le même joueur.

**Validation :** rejeter les objets inconnus (`strict`), PATCH `{}` vide, types incorrects, `ownerId`/`id`/timestamps reçus du client, tags trop longs, mauvais ObjectId. La validation frontend améliore l'ergonomie ; la validation serveur est l'autorité.

## 8. Contrat de notre API HTTP v1

**Base :** `/api` ; HTTP/JSON UTF-8 ; serveur configurable via `PORT` ; CORS sur origines autorisées ; documentation OpenAPI publique en lecture. La spécification du tracker est distincte de la spécification tierce Deadlock API.

| Méthode | Chemin | Accès | Réponse attendue |
|---|---|---|---|
| GET | `/api/health` | Public | 200 `{ "status": "ok" }` |
| POST | `/api/auth/register` | Public | 201 `{ "user": { "id", "email" }, "token" }` |
| POST | `/api/auth/login` | Public | 200, même forme que register |
| GET | `/api/players/search?q=...` | Public | 200 `{ "items": [...], "meta": {...} }` |
| GET | `/api/players/:steamId` | Public | 200 profil normalisé |
| GET | `/api/players/:steamId/matches` | Public | 200 historique normalisé |
| GET | `/api/tracked-players` | Bearer JWT | 200 `{ "items": [...] }` |
| POST | `/api/tracked-players` | Bearer JWT | 201 suivi créé |
| GET | `/api/tracked-players/:id` | Bearer JWT | 200 suivi appartenant au compte |
| PATCH | `/api/tracked-players/:id` | Bearer JWT | 200 suivi modifié |
| DELETE | `/api/tracked-players/:id` | Bearer JWT | 204 sans corps |
| GET | `/api/heroes` | Public / P1 | 200 catalogue normalisé |
| GET | `/api/heroes/:heroId/stats` | Public / P1 | 200 statistiques filtrées |
| GET | `/api/matches/:matchId` | Public / P1 | 200 match normalisé |
| GET | `/api/leaderboard` | Public / P1 | 200 classement normalisé |

### 8.1 Exemples de requêtes et réponses contractuelles

**POST /api/auth/register**

```json
{"email":"alice@example.test","password":"MotDePasse123!"}
```

**201 — exemple de forme de réponse**

```json
{"user":{"id":"507f1f77bcf86cd799439011","email":"alice@example.test"},"token":"<jwt-signe>"}
```

**POST /api/tracked-players** avec `Authorization: Bearer <JWT>`

```json
{"steamId":"76561198000000000","alias":"Partenaire régulier","note":"Très bon sur son héros principal","tags":["duo","ranked"]}
```

**201 — suivi créé**

```json
{"id":"507f1f77bcf86cd799439012","steamId":"76561198000000000","alias":"Partenaire régulier","note":"Très bon sur son héros principal","tags":["duo","ranked"],"createdAt":"2026-11-16T09:00:00.000Z","updatedAt":"2026-11-16T09:00:00.000Z"}
```

**GET /api/tracked-players** : enveloppe obligatoire `{ "items": [<suivi>, ...] }` et `{ "items": [] }` lorsque la liste est vide.

**PATCH /api/tracked-players/:id** : exemple `{ "note": "Analyse mise à jour" }` → 200 avec objet complet. Un PATCH vide ou contenant `ownerId` est rejeté avec 400.

**DELETE /api/tracked-players/:id** : 204 sans corps ; la même ressource retourne ensuite 404.

### 8.2 Format d'erreur et statuts

Toutes les erreurs applicatives renvoient une enveloppe homogène :

```json
{"error":{"code":"INVALID_INPUT","message":"Message compréhensible sans information sensible"}}
```

| HTTP | Code | Contexte |
|---|---|---|
| 400 | `INVALID_INPUT` | JSON/champs/identifiants invalides, PATCH vide. |
| 401 | `UNAUTHORIZED` | Jeton absent, invalide, expiré ou connexion refusée. |
| 404 | `NOT_FOUND` | Ressource absente ou appartenant à un autre utilisateur. |
| 409 | `EMAIL_ALREADY_USED` | Email déjà enregistré. |
| 409 | `ALREADY_TRACKED` | Joueur déjà présent dans la liste privée du compte. |
| 429 | `RATE_LIMITED` | Limitation locale de notre API. |
| 502 | `UPSTREAM_ERROR` | Réponse externe inexploitable / erreur du fournisseur. |
| 503 | `SERVICE_UNAVAILABLE` | Service externe indisponible sans cache exploitable. |

Le `404` pour une ressource privée d'autrui est intentionnel : le serveur ne confirme pas son existence. Les erreurs externes ne doivent pas exposer les URL internes, les clés ou les traces.

## 9. API Deadlock : dépendances et mapping

**Fournisseur :** https://api.deadlock-api.com ; API communautaire indépendante de Valve. L'application ne dépend pas du fournisseur pour ses utilisateurs ni pour les suivis privés ; elle en dépend pour l'enrichissement statistique.

| Fonction tracker | Endpoint source | Priorité | Précaution |
|---|---|---|---|
| Recherche Steam | `GET /v1/players/steam-search` | P0 | Plusieurs résultats, comptes inactifs et absence de résultat. |
| Profil Steam | `GET /v1/players/steam` | P0 | Images/noms parfois indisponibles. |
| Historique de match | `GET /v1/players/{account_id}/match-history` | P0 | Historique potentiellement incomplet. |
| Rang du joueur | `GET /v1/players/{account_id}/rank` | P1 | Rang absent si données classées non disponibles. |
| Stats par héros | `GET /v1/players/hero-stats` | P1 | Filtres de mode/période et nombre de matchs. |
| Métadonnées d'un match | `GET /v1/matches/{match_id}/metadata` | P1 | Champs lourds disponibles conditionnellement. |
| Catalogue héros | `GET /v1/assets/heroes` | P1 | Assets mis en cache ; correspondance des identifiants. |
| Analyses héros | `GET /v1/analytics/hero-stats` | P1 | Cohérence des filtres et échantillons. |
| Counters et synergies | `/v1/analytics/hero-counter-stats`, `/hero-synergy-stats` | P2 | Agrégations coûteuses, cache long. |
| Builds | `GET /v1/builds` | P2 | Ne pas confondre builds suggérés et achats réels. |
| Leaderboard | `GET /v1/leaderboard/{region}` | P1 | Vérifier régions acceptées. |
| Patchs | `GET /v2/patches` | P2 | Versionnement de source. |
| Replays | `POST /v1/matches/demo/query` | P2 | Travaux asynchrones, hors requêtes interactives. |

**Ne pas utiliser les anciens endpoints MMR** pour le système principal de rang : ils sont dépréciés. L'historique compétitif repose notamment sur les champs `ranked_display_badge` et `ranked_delta` lorsque présents.

### 9.1 Contrat de résilience

- Toute requête externe passe par `DeadlockClient` côté backend ; aucune clé API n'est livrée au navigateur.
- Timeout explicite, suivi des codes HTTP, respect de `Retry-After` sur 503/504 et 429 le cas échéant.
- Déduplication des requêtes concurrentes identiques ; limites de concurrence ; éventuellement une clé API privée.
- Données normalisées et validées à l'entrée : aucun composant React ne manipule directement un modèle brut de l'API tierce.
- Réponses avec `sourceUpdatedAt`, `fetchedAt`, `isStale` ou métadonnées équivalentes quand pertinent.
- Quand l'historique est partiel : libellé explicite « parties disponibles » et jamais « historique complet ».
- En cas d'indisponibilité, une fiche peut afficher la dernière version en cache avec date et avertissement ; le CRUD privé continue de fonctionner.
- Journaliser erreurs techniques côté serveur, pas les secrets ni les mots de passe.

### 9.2 Cache initial (à ajuster après mesures)

| Donnée | TTL recommandé initialement | Stratégie |
|---|---|---|
| Résultats recherche | 5 min | Cache court ; recherche répétée peu coûteuse. |
| Profil Steam | 15 min | Rafraîchissement contrôlé. |
| Historique | 3 min | Présenter date de collecte. |
| Rang | 5 min | Priorité à l'exactitude disponible. |
| Catalogue héros/items | 24 h | Invalidation lors des patchs. |
| Stats méta | 30 min | Clé de cache inclut tous les filtres. |
| Match terminé | Plusieurs jours | Enrichir le cache si données initialement incomplètes. |

Les TTL ci-dessus sont des **choix du projet**, pas des garanties publiées par Deadlock API.

## 10. Architecture technique cible

**Deux dépôts Git séparés et déployables indépendamment :**

- `deadlock-tracker-front` : React, Vite, TypeScript, React Router, TanStack Query, Tailwind CSS, UI accessible, visualisations.
- `deadlock-tracker-back` : Node.js, Express (sous réserve de validation académique), TypeScript, Zod, MongoDB/Mongoose, JWT, intégration Deadlock API, OpenAPI, tests.

**Flux :** Navigateur React → notre API HTTP/JSON (`/api`) → modules Express → MongoDB pour les comptes et suivis / Deadlock API pour les stats. En développement, proxy Vite pour `/api`. En production, origines CORS explicites ou reverse proxy unique.

### 10.1 Arborescence frontend cible

```text
deadlock-tracker-front/
  src/
    app/                  # providers, router, query client
    pages/                # home, login, register, player, tracked, not-found
    features/
      auth/ players/ matches/ tracked-players/ heroes/
    components/           # design system, layout, empty/loading/error states
    api/                  # client HTTP typé pour notre backend
    styles/               # tokens et styles globaux
    test/                 # mocks et tests frontend
  Dockerfile
  .env.example
  README.md
```

### 10.2 Arborescence backend cible

```text
deadlock-tracker-back/
  src/
    app.ts                # application importable sans ouvrir le port
    index.ts              # démarrage effectif du serveur
    config/               # validation env et configuration
    modules/
      auth/               # routes, schémas, services, repository
      tracked-players/    # routes, schémas, services, modèle
      players/            # recherche et profil normalisé
      matches/            # historique et détail
      heroes/             # catalogue et analytics
    integrations/deadlock/# client externe + mappings
    database/             # Mongo connection, index, seeds de test
    middleware/           # JWT, erreurs, rate limits
    shared/               # réponses, helpers, logging
    docs/                 # OpenAPI
  tests/
  Dockerfile
  compose.yaml
  .env.example
  README.md
```

**Précision sur la séparation Git :** le backend fournit un `openapi.json` versionné ou publié ; le frontend génère ou met à jour son client depuis ce contrat. Chaque CI peut valider le contrat. Aucun partage de paquet local obligatoire entre les deux repositories.

## 11. Modèle de données MongoDB

### 11.1 `users`

`_id: ObjectId`, `email: string` unique et normalisé, `passwordHash: string`, `createdAt: Date`, `updatedAt: Date`. Ne jamais afficher ni sérialiser le hash. Politique de suppression de compte hors MVP.

### 11.2 `tracked_players`

`_id: ObjectId`, `ownerId: ObjectId` (référence à users), `steamId: string`, `alias: string`, `note: string`, `tags: string[]`, `createdAt: Date`, `updatedAt: Date`. Index `{ ownerId: 1, steamId: 1 }` unique ; index `{ ownerId: 1, updatedAt: -1 }` pour la liste. Toutes les opérations utilisent `ownerId` dans le filtre MongoDB.

### 11.3 `api_cache` (optionnel dans P0, conseillé dès la recherche)

`key: string` unique, `payload: object`, `fetchedAt: Date`, `expiresAt: Date`, `source: string`. Index TTL sur `expiresAt`. Un cache en mémoire est acceptable au départ mais ne doit pas être présenté comme durable.

### 11.4 `player_snapshots` (P2)

`steamId`, `observedAt`, `rank`, agrégats de performance, source/méthode. Un historique longitudinal fondé sur nos snapshots ne doit pas être confondu avec un historique natif exhaustif fourni par Valve.

## 12. Spécification des écrans React

| Écran | URL indicative | Comportements essentiels |
|---|---|---|
| Accueil | `/` | Barre de recherche mise en avant, accès connexion, aperçu du site. |
| Recherche | `/search?q=...` | Résultats, loaders, erreurs, aucun résultat, navigation clavier. |
| Profil public | `/players/:steamId` | En-tête joueur, statistiques, historique accessible, action « Suivre ». |
| Inscription | `/register` | Email, mot de passe, validations, redirection cohérente. |
| Connexion | `/login` | Formulaire, erreur générique, état de session. |
| Mes suivis | `/tracked` | Liste privée, état vide, accès détail, filtre local éventuel. |
| Détail d'un suivi | `/tracked/:id` | Profil lié, alias, note, tags, édition, suppression confirmée. |
| Héros (P1) | `/heroes` | Catalogue, filtres. |
| Match (P1) | `/matches/:matchId` | Tableau de match, statistiques. |
| Non trouvé | `*` | Retour accueil et erreur compréhensible. |

**États UX systématiques :** chargement, skeleton raisonnable, vide, erreur réseau, 401 session expirée, indisponibilité API tierce, données périmées et succès de mutation. Les messages d'échec ne doivent pas faire croire qu'une action a réussi.

**Direction UI :** interface sombre et soignée, inspirée du jeu sans recopier son HUD ; priorité à la lisibilité des nombres, à la hiérarchie des métriques, à la navigation rapide et à la densité maîtrisée. Composants accessibles, focus visible, labels explicites, contrastes adaptés, responsive à partir des écrans mobiles. Les effets Motion restent discrets et respectent `prefers-reduced-motion`.

## 13. Authentification, autorisation et sécurité

1. Hacher avec `bcrypt` et stocker uniquement le hash ; mots de passe jamais journalisés.
2. JWT signé côté serveur avec une clé suffisamment longue depuis l'environnement, durée de vie courte configurée ; vérifier signature, expiration, type et algorithme attendu.
3. Utiliser `Authorization: Bearer <JWT>` pour toutes les routes personnelles ; vérifier dans le backend, jamais seulement dans React.
4. `ownerId` issu exclusivement du JWT ; appliquer le filtre propriétaire dans les requêtes MongoDB (y compris PATCH/DELETE), et rendre 404 pour les ressources d'un autre utilisateur.
5. Rejeter `id`, `_id`, `ownerId`, propriétés supplémentaires et entrées malformées dans les schémas métier.
6. Protéger l'authentification par limitation de débit ; ne pas divulguer si un email existe lors de l'échec de connexion.
7. Restreindre CORS aux origines prévues ; ne pas exposer MongoDB sur Internet ; désactiver les traces en production.
8. Stratégie de session MVP : JWT access token en mémoire JS ; un rechargement complet exige une reconnexion (choix simple et sûr pour un workshop). Une stratégie de persistance plus confortable exige une conception spécifique de refresh token/cookie et de protection CSRF.
9. Secrets exclusivement dans l'environnement, jamais dans Git, dans les réponses, dans les images Docker ou dans les fichiers de test committés.
10. La clé API Deadlock, si nécessaire, ne traverse jamais le navigateur.

## 14. Docker, environnements et exécution

### 14.1 Environnement local

Les deux repositories sont clonés côte à côte. `deadlock-tracker-back/compose.yaml` lance **backend + MongoDB** sur un réseau Docker interne. Le frontend démarre avec Vite en local ou par son Dockerfile ; un fichier Compose d'intégration peut référencer le dossier frère sans créer de troisième dépôt.

- Frontend Vite : `http://localhost:5173`.
- Backend : `http://localhost:3001` ou port défini par `PORT`.
- MongoDB : uniquement accessible au backend par le nom de service `mongodb:27017` ; port hôte facultatif limité à `127.0.0.1` pour la maintenance.
- Volume persistant Docker pour MongoDB, afin que la base résiste au redémarrage des containers.
- Healthcheck applicatif ; ordre de démarrage fondé sur la disponibilité du service MongoDB, pas uniquement sur la création du container.

### 14.2 Variables et secrets

**Backend :** `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `DEADLOCK_API_BASE_URL`, `DEADLOCK_API_KEY` (facultative), `LOG_LEVEL`. **Frontend :** `VITE_API_BASE_URL` si proxy non utilisé. Les fichiers `.env.example` contiennent seulement des exemples fictifs et documentent les valeurs attendues.

### 14.3 Commandes reproductibles

Prévoir et documenter `npm install` (ou pnpm si choisi), `dev`, `build`, `lint`, `test`, `test:coverage`, `docker compose up --build`, `docker compose down` et `docker compose down -v` (avec avertissement explicite de destruction des données). Les commandes exactes devront être testées depuis une installation propre.

## 15. Exigences non fonctionnelles et critères mesurables

| ID | Exigence | Critère de vérification |
|---|---|---|
| NF-01 | Réutilisabilité | Une personne extérieure lance le système depuis les deux READMEs sans consigne orale implicite. |
| NF-02 | Persistance | Le suivi conservé est toujours consultable après redémarrage du backend et du container MongoDB sans suppression du volume. |
| NF-03 | Isolation | Toute lecture, modification ou suppression cross-account d'un suivi renvoie 404. |
| NF-04 | Validation | Une donnée métier invalide ne modifie pas la base ; 400 avec erreur JSON homogène. |
| NF-05 | Robustesse externe | Timeout, erreur 503 et résultat vide simulés produisent des écrans utilisables ; le CRUD privé reste disponible. |
| NF-06 | Qualité | `lint`, `build` et `test` s'exécutent sans échec dans chaque dépôt. |
| NF-07 | Accessibilité | Parcours principal au clavier ; libellés, focus visible, messages d'erreur associés aux champs. |
| NF-08 | Responsive | Aucune action critique masquée ou débordement horizontal sur un viewport mobile de 375 px. |
| NF-09 | Traçabilité | Logs structurés sans secrets, rapport d'erreur côté serveur, SHAs identifiables. |
| NF-10 | Temps de réponse interne | Cible indicative : p95 sous 500 ms sur lecture de suivi en local (hors appel externe), à mesurer et non à affirmer sans test. |
| NF-11 | Tests d'intégration | Les tests ne contactent pas l'API Deadlock en direct ; fixtures ou serveur mock déterministes. |
| NF-12 | Contrat | OpenAPI couvre les routes implémentées, schémas, sécurité Bearer et codes de réponse. |

## 16. Stratégie de tests

**Backend — Jest + Supertest :** utiliser un serveur HTTP Node ephemeral sur port dynamique si l'adaptateur Express choisi ne fournit pas directement une cible Supertest ; séparer création de l'app et démarrage réseau. Base Mongo de test distincte, nettoyée entre les tests. Mock de Deadlock API pour éviter que le succès des tests dépende d'Internet.

**Tests requis :**

| ID | Scénario | Attendu |
|---|---|---|
| T-01 | `GET /api/health` | 200 et body exact `{ "status": "ok" }`. |
| T-02 | Register valide | 201, vrai JWT, sans hash. |
| T-03 | Login valide/invalide | 200 / 401. |
| T-04 | Email dupliqué | 409 `EMAIL_ALREADY_USED`. |
| T-05 | Inscription invalide | 400 `INVALID_INPUT`. |
| T-06 | GET suivis sans JWT | 401 `UNAUTHORIZED`. |
| T-07 | POST suivi valide | 201 et objet persisté avec ownerId serveur. |
| T-08 | GET liste vide | 200 `{ "items": [] }`. |
| T-09 | GET/PATCH/DELETE objet A avec JWT B | 404 `NOT_FOUND` dans les trois cas. |
| T-10 | POST/PATCH avec ownerId ou id | 400 `INVALID_INPUT`. |
| T-11 | PATCH vide, tags incorrects, ID malformé | 400 `INVALID_INPUT`. |
| T-12 | PATCH partiel valide | 200, autres champs préservés. |
| T-13 | DELETE existant | 204 corps vide, GET ensuite 404. |
| T-14 | Redémarrage serveur | Les suivis non supprimés sont conservés. |
| T-15 | Recherche avec mock API externe | Réponse normalisée ; aucune clé tierce exposée. |
| T-16 | Timeout / réponse 503 API tierce | Erreur ou cache périmé propre, sans crash. |
| T-17 | Front : parcours complet | Inscription, connexion, suivi, édition, suppression via navigateur. |
| T-18 | UI mobile + clavier | Contrôles utilisables sur petit viewport et au clavier. |

**Frontend :** Vitest + React Testing Library pour composants/formulaires ; Playwright pour un scénario de bout en bout. Si le temps est insuffisant, la priorité absolue est la suite backend imposée et la recette manuelle navigateur.

**CI :** chaque push / pull request exécute lint, test, build ; la CI du frontend peut vérifier la compatibilité avec le schéma OpenAPI publié du backend. Ne pas rendre un test dépendant des limites de débit de Deadlock API.

## 17. Recette fonctionnelle de fin de projet

**Préconditions :** les deux dépôts sont clonés ; secrets fictifs remplacés localement ; Docker lancé ; une base de test et deux comptes A/B disponibles ; la documentation explique clairement le démarrage.

**Critères de validation bloquants :**

1. Frontend et backend démarrent indépendamment et communiquent réellement par HTTP.
2. La connexion MongoDB est établie ; une donnée enregistrée persiste après redémarrage.
3. `GET /api/health` est conforme.
4. Inscription/connexion retournent les codes et le format attendus ; JWT signé et hash bcrypt.
5. Les cinq opérations CRUD sur les suivis sont accessibles depuis l'interface.
6. Le propriétaire n'est jamais librement choisi par le navigateur.
7. Un objet d'A est inaccessible à B en GET/PATCH/DELETE avec 404.
8. Les erreurs 400/401/404/409 et leurs enveloppes sont contrôlées.
9. Recherche et fiche joueur utilisent une vraie intégration serveur Deadlock ou un mode de démonstration clairement signalé en cas d'indisponibilité.
10. La documentation OpenAPI décrit les routes réellement implémentées.
11. Jest/Supertest, ESLint et build fonctionnent.
12. La démonstration peut se dérouler en 4 minutes sans intervention dans la base.
13. Aucun secret, fichier `.env` ou `node_modules` dans Git.
14. Les SHAs du front et du back correspondant au rendu sont identifiables.

Tout point ci-dessus non vérifié est indiqué comme « non testé » et non comme « terminé ».

## 18. Plan de réalisation — 4 jours / 28 heures

| Jour | Objectif | Livrable vérifiable |
|---|---|---|
| J1 — 7 h | Initialiser les deux repos ; React/Vite ; Node/Express ; MongoDB + Docker ; modèles et CRUD initial ; route de santé ; première version OpenAPI. | API lancée, Mongo persistant, GET/POST/PATCH/DELETE testés avec client HTTP. |
| J2 — 7 h | Authentification bcrypt/JWT ; isolation A/B ; recherche et fiche joueur ; écrans React auth et CRUD. | Deux comptes isolés ; parcours complet dans le navigateur. |
| J3 — 7 h | Tests Jest/Supertest ; erreurs ; mock API externe ; ESLint/build ; documentation ; responsive et refactoring. | Tests reproductibles, README, OpenAPI, état démo stable. |
| J4 — 7 h | Recette, corrections bloquantes, test installation propre, SHAs, préparation et répétition de l'oral. | Version finale figée + démonstration de 10 minutes préparée. |

**Règle de planification :** interrompre les ajouts P1 dès qu'un critère P0 est menacé. La robustesse et l'explicabilité priment sur la quantité de vues. Les 28 h proviennent du livret et ne constituent pas une estimation garantie de réalisation de toutes les extensions.

## 19. Organisation d'équipe et responsabilités

Le document d'oral parle d'une présentation par groupe. Quelle que soit la taille de l'équipe, chaque tâche doit avoir un responsable et une preuve observable (issue, PR, commit, démonstration). Répartition de principe : **frontend et parcours UI**, **backend et sécurité**, **données/Deadlock API**, **qualité/recette/documentation**. Ces rôles peuvent être cumulés ; aucun membre ou effectif n'est présumé.

**Règles Git :** branches de fonctionnalité, PR pour les changements structurants, commits cohérents, revue de contrat API avant modification de route, synchronisation explicite des versions front/back. Le README indique pour chaque repository un SHA de livraison et la version compatible de l'autre.


### 19.1 Objet : travailler en parallèle sur deux dépôts

Ce cahier des charges est le contrat de travail partagé : le développeur frontend sait précisément quelles routes, données, erreurs et contraintes livrera le backend ; le développeur backend connaît les écrans, interactions et scénarios à satisfaire. Le front est intégralement développable en mode mock avant le premier démarrage de l’API Express. Les exemples ci-après sont des DTO normalisés de NOTRE backend, et non des exemples bruts garantis par l’API Deadlock communautaire.

- L’unique point d’accord préalable est le contrat HTTP v1 : noms de routes, formes de réponses, types, champs facultatifs, statuts et erreurs.
- Frontend : mise en page, navigation, composants, états UX, mocks locaux et tests ; aucune dépendance de développement à MongoDB ou à Deadlock API.
- Backend : sécurité, validation, CRUD MongoDB, endpoints publics, normalisation de Deadlock API, Swagger/OpenAPI et tests ; aucune dépendance à une UI fonctionnelle.
- Le premier branchement se fait sur une API stable ; on ne reporte pas à cette date la définition du contrat.

### 19.2 Matrice de responsabilités et livrables

| Livrable / activité | Responsable FRONTEND | Responsable BACKEND |
| --- | --- | --- |
| Contrat HTTP v1 et évolutions | Relit, approuve, copie OpenAPI à SHA connu | Rédige/maintient OpenAPI, exemples et changelog |
| Recherche & profil | Pages, filtres, skeleton, empty/error states et fixtures | GET search/profil/historique, mapping Deadlock API, cache |
| Auth et espace privé | Formulaires, état de session, headers Bearer, UI CRUD mock | Register/login, bcrypt, JWT, contrôles de propriété et MongoDB |
| Données et persistance | Simule les mutations en MSW avec état mémoire de session | Mongoose, index, CRUD durable, gestion des erreurs |
| Tests | Vitest/RTL + Playwright, cohérence des fixtures DTO | Jest/Supertest, tests A/B, validation, contrat et upstream mocké |
| Docker et exploitation | Dockerfile front, env Vite, proxy et README | Dockerfile API, Compose API+Mongo, env serveur et README |
| Intégration finale | Désactive MSW, vérifie parcours réels et remonte les écarts | Déploie routes, corrige divergences, garantit API stable |
| Oral | Présente UX, mocks, intégration, un choix technique | Présente données, JWT, autorisation, tests, une difficulté résolue |

### 19.3 Contrat HTTP v1 figé pour le P0

Base URL en local : /api via proxy Vite -> http://localhost:3001. En production, l’URL dépend du déploiement. HTTP/JSON UTF-8 ; propriétés en camelCase ; identifiants transmis comme strings, sauf accountId numérique sûr et heroId numérique ; toutes les dates de date-heure sont des chaînes ISO 8601 UTC. Aucun composant n’utilise de clé ou de champ brut de Deadlock API.

| Méthode / route | Responsabilité backend | Attendu dans le frontend |
| --- | --- | --- |
| GET /api/health | 200 exactement {"status":"ok"} | Diagnostic de connexion ; non requis pour le rendu mock |
| POST /api/auth/register | 201 {user:{id,email},token}; 400/409 | Formulaire inscription et connexion initiale |
| POST /api/auth/login | 200 {user:{id,email},token}; 400/401 | Formulaire connexion, état de session |
| GET /api/players/search?q=... | 200 {items:PlayerSummary[],meta:DataMeta}; 400/503 | Liste et recherche sans authentification |
| GET /api/players/:steamId | 200 PlayerProfile; 400/404/503 | Profil public et métriques disponibles |
| GET /api/players/:steamId/matches?limit=20&cursor=... | 200 {items:MatchSummary[],nextCursor,meta}; 400/503 | Liste des parties et bouton « charger plus » |
| GET /api/tracked-players | 200 {items:TrackedPlayer[]} ; JWT | Vue privée, état vide |
| POST /api/tracked-players | 201 TrackedPlayer ; JWT | Ajouter un joueur suivi et rafraîchir la liste |
| GET /api/tracked-players/:id | 200 TrackedPlayer ; JWT | Page détail d’un suivi |
| PATCH /api/tracked-players/:id | 200 TrackedPlayer ; JWT | Éditer alias/note/tags |
| DELETE /api/tracked-players/:id | 204 sans corps ; JWT | Retirer un suivi après confirmation |

Pagination P0 : matches.limit est entier 1–50, valeur par défaut 20 ; matches.cursor est un jeton opaque transmis tel quel, jamais interprété par React. search.q est une chaîne non vide après trim. Pour toute route non terminée, le backend doit répondre avec un état d’erreur cohérent ; aucun endpoint fictif ne doit être présenté comme opérationnel.

### 19.4 Modèles de réponse JSON : sources de vérité pour les mocks

DataMeta est requis sur les réponses alimentées par Deadlock API : fetchedAt (ISO), sourceUpdatedAt (ISO|null), isStale (boolean), isPartial (boolean). Les champs statistiques inconnus sont null et non 0. Les résultats de recherche peuvent avoir avatarUrl null ; le frontend fournit un avatar de remplacement.

A. Recherche d’un joueur — GET /api/players/search?q=Exemple

```json
{
  "items": [
    {
      "steamId": "76561198000000000",
      "accountId": 39734272,
      "displayName": "ExempleJoueur",
      "avatarUrl": null
    }
  ],
  "meta": {
    "fetchedAt": "2026-11-16T09:00:00.000Z",
    "sourceUpdatedAt": null,
    "isStale": false,
    "isPartial": false
  }
}
```

B. Profil — GET /api/players/:steamId

```json
{
  "player": {
    "steamId": "76561198000000000",
    "accountId": 39734272,
    "displayName": "ExempleJoueur",
    "avatarUrl": null
  },
  "stats": {
    "matchesPlayed": 121,
    "wins": 65,
    "losses": 56,
    "winRate": 53.72,
    "kills": 998,
    "deaths": 842,
    "assists": 1374,
    "kda": 2.82
  },
  "rank": {
    "badgeId": null,
    "name": null
  },
  "meta": {
    "fetchedAt": "2026-11-16T09:00:00.000Z",
    "sourceUpdatedAt": null,
    "isStale": false,
    "isPartial": false
  }
}
```

C. Historique — GET /api/players/:steamId/matches

```json
{
  "items": [
    {
      "matchId": "123456789",
      "playedAt": "2026-11-15T20:00:00.000Z",
      "heroId": 5,
      "heroName": "Héros exemple",
      "outcome": "win",
      "durationSeconds": 2170,
      "kills": 12,
      "deaths": 5,
      "assists": 15,
      "netWorth": 44300
    }
  ],
  "nextCursor": null,
  "meta": {
    "fetchedAt": "2026-11-16T09:00:00.000Z",
    "sourceUpdatedAt": null,
    "isStale": false,
    "isPartial": false
  }
}
```

D. Ressource suivie privée — POST/PATCH/GET /api/tracked-players/:id

```json
{
  "id": "507f1f77bcf86cd799439012",
  "steamId": "76561198000000000",
  "alias": "Duo régulier",
  "note": "Joue souvent en classé",
  "tags": [
    "duo",
    "ranked"
  ],
  "createdAt": "2026-11-16T09:00:00.000Z",
  "updatedAt": "2026-11-16T09:00:00.000Z"
}
```

E. Authentification — POST /api/auth/login ou /register

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "alice@example.test"
  },
  "token": "<JWT_SIGNE_REEL_EN_MODE_BACKEND>"
}
```

F. Erreur — exemple de dépendance Deadlock API indisponible

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Les statistiques sont temporairement indisponibles."
  }
}
```

Les statistiques chiffrées ci-dessus sont synthétiques et servent exclusivement aux tests UI ; elles ne prétendent pas représenter un joueur réel. Le backend définira les règles d’agrégation et les champs absents avant consommation de l’API réelle. Les valeurs de rank et stats peuvent être null si la source ne permet pas de les établir ; un 404 indique un joueur introuvable, et non l’absence de statistique.

### 19.5 Conventions de validation, statuts et erreurs

| Cas | Statut + code | Traitement frontend |
| --- | --- | --- |
| Champ/ID invalide, PATCH vide, ownerId envoyé | 400 INVALID_INPUT | Afficher erreur de formulaire, conserver les saisies |
| JWT absent, expiré, falsifié ; login refusé | 401 UNAUTHORIZED | Retour connexion / demander reconnexion |
| Joueur absent ou objet privé d’un autre compte | 404 NOT_FOUND | Page introuvable sans divulgation |
| Email déjà utilisé | 409 EMAIL_ALREADY_USED | Message sur le champ email |
| Joueur déjà présent dans la liste privée | 409 ALREADY_TRACKED | Proposer de consulter le suivi existant |
| Limite de requêtes de notre backend | 429 RATE_LIMITED | Information et nouvel essai après délai |
| Source externe indisponible ou timeout | 503 SERVICE_UNAVAILABLE | Données périmées avec alerte ou état indisponible |
| Erreur interne imprévue | 500 INTERNAL_ERROR | Message générique sans détails techniques |

Le backend retourne toujours {"error":{"code":"...","message":"..."}} pour ses erreurs applicatives. En cas d’indisponibilité tierce et de cache utilisable, il peut servir la dernière donnée avec meta.isStale=true et les timestamps associés. Jamais de mot de passe, hash, secret, stack trace ou ownerId dans les réponses publiques/privées du client.

### 19.6 Mode frontend mock-first : spécification obligatoire

Le frontend fonctionne dès J1 avec une même couche API pour les deux environnements ; l’UI et TanStack Query ne savent pas si la réponse provient du réseau ou de MSW. Le mode mock se configure par VITE_API_MODE=mock|real, défaut mock en développement ; il ne doit pas être actif involontairement en production.

```text
src/
  api/client.ts                  # fetch, Bearer, erreurs, types
  api/players.ts                 # appels joueur sans logique UI
  api/auth.ts                    # appels authentification
  api/trackedPlayers.ts          # CRUD privé
  contracts/openapi.yaml         # copie figée du backend
  mocks/browser.ts               # initialisation MSW au démarrage
  mocks/handlers.ts              # interception /api/*
  mocks/fixtures/*.json          # exemples conformes au contrat
  mocks/scenarios.ts             # states : success, empty, partial, error
```

- Fixtures obligatoires : recherche avec résultats, recherche vide, profil complet, profil partiel, matchs présents, aucun match, authentification réussie/refusée, liste privée vide/peuplée, création, PATCH, DELETE, 401, 404, 409 et 503.
- MSW simule un vrai CRUD cohérent avec un stockage en mémoire par compte fictif : POST ajoute, GET retourne l’état modifié, PATCH modifie, DELETE enlève. Les données de départ sont reproductibles au rechargement ; elles ne prétendent pas être persistantes.
- Un faux JWT ne sert qu’à MSW ; il n’est jamais envoyé au serveur réel ni présenté comme sécurisé. Les tests d’autorisation réelle appartiennent au backend.
- Utiliser des identifiants Steam fictifs, images de remplacement et valeurs synthétiques, pas de données personnelles ni de secrets.
- Les loaders et skeletons simulent une latence contrôlée ; les erreurs doivent produire les mêmes écrans que lors d’une vraie requête HTTP.
- VITE_API_MODE=real coupe totalement les handlers MSW, utilise le proxy Vite /api et garde les mêmes types, hooks, composants et routes React.

### 19.7 Livraison progressive du backend / handoff

| Étape / état | Livrable observable du BACKEND | Action indépendante du FRONTEND |
| --- | --- | --- |
| Contrat validé (J1) | openapi.yaml, erreurs, exemples, DTO figés | Générer types, écrire fixtures, démarrer tout le parcours mock |
| Socle disponible | GET /api/health ; Express/Mongo via Docker | Vérifier proxy et connectivité, sans perdre le mode mock |
| Auth + CRUD prêts | Register/login JWT + 5 routes suivis ; tests A/B | Basculer auth/CRUD sur API réelle et tester parcours |
| Statistiques publiques prêtes | Recherche, profil, matchs normalisés ; cache/timeout | Basculer recherche/profil/historique et comparer aux fixtures |
| Gel intégration (J3/J4) | Swagger à jour, tests verts, environnement documenté | Tests de bout en bout réels, corrections UX, validation de recette |

Le responsable backend maintient un tableau des routes : NON COMMENCÉE / EN COURS / PRÊTE / TESTÉE, avec exemple de réponse, date de disponibilité, version de contrat, SHA et limite connue. Le frontend n’attend pas l’API pour développer les écrans : il la consomme seulement lorsque la route est indiquée PRÊTE, après validation du contrat.

### 19.8 Procédure de passage des mocks aux vraies données

- 1. Pinner la même version d’OpenAPI dans les deux repos ; vérifier que les DTO et les exemples sont identiques.
- 2. Lancer MongoDB + backend dans Docker ; exécuter GET /api/health ; mettre VITE_API_MODE=real et VITE_API_BASE_URL=/api.
- 3. Effectuer register/login, conserver un vrai Bearer JWT, exécuter le CRUD sur un compte A, vérifier redémarrage Mongo/API et isolation contre un compte B.
- 4. Comparer search/profile/matches : structure, champs null, date/format, errors, pagination, accents, 0 vs absence, images et état partiel.
- 5. Supprimer toute dépendance de production aux fixtures ; conserver MSW pour tests et développement sans backend.
- 6. Exécuter recettes React, Jest/Supertest, Playwright, lint, build et Docker ; noter les SHA de front et back.

Critère de bascule : changer uniquement l’environnement mock/real suffit pour rendre les mêmes écrans. Toute condition codée dans un composant du type « si mock alors ce champ existe » est un défaut d’intégration à corriger.

### 19.9 Synchronisation, changements de contrat et critères de fin

- Dès J1 : validation commune des routes P0, champs DTO et cas d’erreur ; création des exemples JSON et du contrat OpenAPI version 1.0.0.
- Chaque jour : point court sur routes livrées, contrat modifié, bugs bloquants, prochaine fonctionnalité ; les tâches restent parallélisables.
- Tout changement incompatible (champ retiré/renommé, route modifiée, statut modifié) exige une revue et une nouvelle version majeure du contrat ; ajout rétrocompatible = mineure ; correction documentaire = patch.
- Définition de terminé FRONT : écran responsive, état nominal/vide/loading/erreur, données MSW contractuelles, tests UI, absence de logique métier backend dans les composants.
- Définition de terminé BACK : route documentée, validation Zod ou équivalent, sécurité requise, Mongo persistant, tests nominaux/négatifs/A-B, exemples contractuels, pas de secret exposé.
- Définition de terminé COMMUN : parcours utilisateur complet sur API réelle, compatibilité des deux SHA, absence de divergence JSON, démonstration reproductible avec Docker et README.

## 20. Livrables attendus

**Repository frontend :** code React, README installation/configuration, `.env.example`, Dockerfile, tests UI, scripts de qualité, contrats OpenAPI recopiés et versionnés, fixtures JSON, handlers MSW, scénarios chargement/vide/erreur, commandes mode mock et mode réel.

**Repository backend :** code Node/Express, modèle Mongoose, routes CRUD/auth/publiques, OpenAPI Swagger source de vérité, exemples de réponses, `.env.example`, Dockerfile, Compose (Mongo + API), tests Jest/Supertest, fixtures upstream, README, schéma MongoDB, statut des routes.

**Transverse :** ce cahier des charges, schéma de flux, matrice de recette avec résultats, journal des arbitrages techniques, deux SHAs de release, scénario de démonstration et preuve d'exécution des tests.

**Non fournis :** secrets réels, données personnelles de joueurs, fichiers `.env`, `node_modules`, volumes Docker, identifiants MongoDB de production.

## 21. Soutenance orale — 10 minutes

Le document « ORAL DevFullStack » fixe la trame suivante, que nous reprenons :

| Temps | Contenu | Démonstration / preuve |
|---|---|---|
| 1 min | Présentation du projet | Besoin, proposition de valeur, fonctionnalités principales. |
| 2 min | Architecture et choix | Schéma React ↔ Node/Express ↔ MongoDB / Deadlock API ; collections ; JWT ; deux repos. |
| 4 min | Prototype fonctionnel | Inscription, connexion, recherche, CRUD privé, A/B, données persistantes. |
| 2 min | Organisation et difficultés | Répartition concrète, un incident technique et sa résolution vérifiable. |
| 1 min | Bilan et perspectives | Terminé / non terminé, limites API, améliorations P1/P2. |

**Barème du document oral (20 points) :** fonctionnalités et intégration full stack (6), architecture/qualité/organisation du code (5), robustesse/validation/sécurité/tests (4), organisation et équipe (2), clarté/démonstration (3). Les slides sont facultatives ; les membres doivent tous prendre la parole. Préparer des comptes de test et des données disponibles avant l'oral.

La grille du livret (barème proposé différent) ne remplace pas le barème du document oral. La modalité officielle finale doit être confirmée auprès de l'encadrement.

## 22. Risques et mesures d'atténuation

| Risque | Impact | Mesure |
|---|---|---|
| Express non accepté au regard du livret | Critique pour la conformité | Faire valider expressément ; sinon Express. |
| Sujet Deadlock hors catalogue fermé | Critique pour la conformité | Formaliser l'accord du formateur et le contrat CRUD adapté. |
| Deux dépôts refusés | Élevé | Vérifier les modalités ; pouvoir fournir les deux liens et une archive de livraison conjointe sur demande. |
| API Deadlock lente/partielle | Élevé | Mock déterministe pour tests ; cache + message de fraîcheur ; démonstration préparée. |
| Champ externe renommé | Moyen | Adaptateur backend, validation Zod, tests de contrat. |
| Débordement du MVP | Élevé | Priorité auth + CRUD privé + intégration simple ; P1 hors chemin critique. |
| Sécurité inter-comptes défaillante | Critique | Scénarios A/B obligatoires et filtres `ownerId` dans Mongo. |
| Mongo non persistant sous Docker | Élevé | Volume nommé + test de redémarrage. |
| Démo dépendante du réseau | Moyen | Présenter clairement un fallback de données de test sans le faire passer pour du live. |
| Usage d'assets de Valve | Moyen | Vérifier les autorisations applicables ; attribution et politique de réutilisation. |

## 23. Matrice de traçabilité aux consignes pédagogiques

| Exigence pédagogique | Emplacement dans ce cahier | Source |
|---|---|---|
| React / API Node / MongoDB | Sections 10–11 | Livret pp. 1–2 ; oral p. 2. |
| Authentification email/bcrypt/JWT | Sections 6–8, 13 | Livret pp. 1–2, 6–7. |
| CRUD complet et persistance | Sections 5–8, 11, 17 | Livret pp. 1, 7–9, 12–13. |
| Isolation des comptes | Sections 5, 7, 13, 16–17 | Livret pp. 6, 10–12. |
| Contrats JSON et statuts HTTP | Section 8 | Livret pp. 5–9 ; contrat spécifique Deadlock à autoriser. |
| Jest/Supertest, lint, build | Sections 15–17 | Livret pp. 2, 11–13. |
| README, .env.example, Swagger | Sections 10, 14, 20 | Livret pp. 2, 11, 13. |
| Planning 28 h | Section 18 | Livret pp. 9–12. |
| Oral 10 min, contribution de groupe | Sections 19–21 | Oral pp. 1–3. |
| Barème oral 6/5/4/2/3 | Section 21 | Oral p. 3. |
| Sujets autorisés et dérogations | Section 2 | Livret pp. 1–3, 15. |

## 24. Décisions à faire confirmer avant gel de la V1

1. Deadlock autorisé en remplacement des trois sujets du catalogue ; contrat métier `/api/tracked-players` accepté pour démontrer le CRUD.
2. Express autorisé à remplacer Express ; à défaut, choix d'Express obligatoire pour satisfaire le livret.
3. TypeScript accepté à la place d'un projet strictement JavaScript.
4. Deux dépôts Git acceptés à la remise ; méthode d'archivage éventuelle.
5. Format final du travail : groupe ou individuel et consignes applicables si divergences.
6. Exigence éventuelle d'une URL déployée ; format/date de remise ; politique d'usage de l'IA.

**Règle de validation finale :** le produit doit démontrer un vrai système full stack, compréhensible et reproductible. La disponibilité d'une API publique de statistiques ne remplace jamais l'exigence pédagogique d'authentification, de données privées, de CRUD propre au projet et d'isolation entre comptes.

## 25. Références

- **LIVRET ETUDIANT V2.pdf** — EFREI, *FULL STACK JS — Livret étudiant, cahier des charges, travaux pratiques et rendu final*, 15 pages, version de travail du 24 septembre 2026. En particulier pp. 1–2 (mission/stack), 5–9 (contrat API), 9–13 (TP/recette/livrables), 15 (points à confirmer).
- **ORAL DevFullStack.pdf** — *Workshop Full Stack — Présentation finale*, 3 pages. En particulier pp. 1–2 (déroulé de 10 min), p. 3 (barème sur 20 et consignes).
- **Deadlock API** — https://api.deadlock-api.com/docs/ ; spécification https://api.deadlock-api.com/openapi.json ; source communautaire indépendante de Valve. Contrat à revalider avant implémentation.
- **Express OpenAPI** — https://hono.dev/examples/zod-openapi (documentation technique, non validation pédagogique).
