# Décisions

## Versions

- TypeScript 6.0.3 au lieu de 7.0.2 (dernière version publiée) : `typescript-eslint` 8.72.2 n'accepte pas encore TypeScript 7 en peer dependency.
- `npm audit` signale 7 vulnérabilités modérées (minimatch, via `typescript-eslint`). Outillage de développement uniquement, rien n'est livré au navigateur.

## Contrat d'API

- `PlayerProfile.player.region` (optionnel) est un ajout rétrocompatible au contrat v1 (section 19.4), pour afficher la région de Corvid. À valider avec le back : ajout mineur selon 19.9.
- Le rang d'exemple a `badgeId: null` et `name: "Oracle 4"` : l'identifiant de badge n'est pas connu, il n'est pas inventé.
- `src/contracts/openapi.yaml` (section 19.6) n'est pas présent : le back ne l'a pas encore publié. À copier à SHA connu.

## Mode mock

- Le cahier des charges (19.6) prévoit `VITE_API_MODE=mock|real` avec mock par défaut en développement. Le prompt de départ demande des scripts `dev` (réel) et `dev:mock`. Choix : `dev` vise le vrai back, `dev:mock` active MSW (mode Vite `mock`, ou `VITE_API_MODE=mock`). Le mock est impossible en production.
- Un fichier `.env.example` est attendu (`VITE_API_BASE_URL`, `VITE_API_MODE`) : voir le README pour les variables.

## Interface (P0 du cahier des charges)

- Header en pill flottant (`sticky`, verre sombre). Liens : Joueurs, puis Mes suivis si connecté. Héros et Classement sont retirés : ce sont des routes P1 sans endpoint dans le contrat P0.
- Wordmark : le point n'est plus coloré, il reprend la couleur du texte.
- Palette ⌘K (cmdk dans un dialogue Base UI) : Ctrl/⌘ + K, aucune animation. Recherche vers `/search?q=` et raccourcis de pages.
- Vaul (feuille mobile) est installé mais pas utilisé : aucun écran P0 n'en a besoin.
- Valeur absente : affichée `n/d`, jamais 0 (cahier 19.4).
- Erreurs : 401 vide la session et affiche un toast, les autres codes ont un message clair (`src/lib/messages.ts`). Pas de nouvelle tentative sur les 4xx.
- Pas encore fait : Playwright (T-17), contrat `openapi.yaml`, pages P1 (héros, match, classement).

## Connexion Steam uniquement (accord de l'encadrant)

Remplace email, mot de passe et inscription (cahier 6 à 8, 13). Le front n'a plus de formulaire de connexion ni de page `/register` (redirigée vers `/login`).

Contrat à implémenter côté `baroness-back` :

| Route                                                         | Rôle                                                                                                                                                                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/auth/steam`                                         | Redirige le navigateur vers Steam OpenID (`return_to` = callback du back).                                                                                                                                            |
| callback du back (par exemple `GET /api/auth/steam/callback`) | Vérifie la réponse OpenID auprès de Steam, crée ou retrouve l'utilisateur par `steamId`, signe un JWT, puis redirige vers `<front>/auth/callback#token=<JWT>`. En cas d'échec : `<front>/auth/callback?error=<code>`. |
| `GET /api/auth/me`                                            | Bearer JWT, 200 `{ id, steamId, displayName, avatarUrl }`, 401 sinon.                                                                                                                                                 |

- Le jeton est transmis dans le fragment (`#token=`), jamais envoyé au serveur ni journalisé. Il reste en mémoire : un rechargement complet demande de recliquer sur « Se connecter avec Steam ».
- `PublicUser` devient `{ id, steamId, displayName, avatarUrl }`. `ownerId` des suivis reste l'id utilisateur issu du JWT.
- Les routes `POST /api/auth/register` et `POST /api/auth/login` et le code `EMAIL_ALREADY_USED` disparaissent. Le cahier et le contrat OpenAPI du back sont à mettre à jour.
- Mode mock : le lien Steam mène directement à `/auth/callback#token=<faux jeton>`, l'utilisateur fictif est Corvid. Le faux jeton n'existe qu'en mock.
- Le chemin de retour (page à rouvrir après connexion) est gardé dans `sessionStorage` : chemin interne uniquement, pas le jeton.

## Tests de bout en bout

- Playwright (`npm run test:e2e`) sur `dev:mock` : parcours complet (connexion Steam mock, suivi, modification, suppression), redirection d'une route privée, palette au clavier (T-17), absence de défilement horizontal à 375 px et focus visible (T-18).
- Chromium doit être installé une fois : `npx playwright install chromium`.
- Un `goto` complet recharge la page et efface la session en mémoire : les parcours connectés utilisent la navigation interne.
- Pages chargées à la demande (une par chunk) : le bundle initial passe sous 500 kB.

## Écrans P1 et visuels du catalogue

- Livrés en mock : catalogue des héros (filtres, fiche avec capacités, statistiques de base et de méta), classement par région, détail d'une partie (deux équipes), héros les plus joués et courbes de progression sur le profil, page d'accueil refondue.
- Contrat des routes P1 proposé dans `docs/back-p1-contract.md`, à valider avec le back.
- Visuels réels : portraits de héros, icônes de capacités, icônes de rang et visuel de carte viennent de Deadlock API (`npm run` non requis, voir `scripts/build-fixtures.mjs`, à relancer pour rafraîchir les fixtures). Ils sont affichés depuis le CDN du catalogue, avec repli (initiales, pastille) si l'image échoue.
- Les images, noms et textes de héros appartiennent à Valve : attribution dans le pied de page. À valider pour la remise (risque identifié dans le cahier, section 22).
- Joueurs, parties, classements et statistiques de méta des fixtures sont synthétiques et déterministes (`src/mocks/synthetic.ts`). Aucun joueur réel.
- Les courbes de progression s'appuient sur les parties chargées (20 par page) : le libellé le dit.

## Groupes et comparaison

- Demande produit : comparer des amis (classement, progression de rang, meilleures parties). Hors périmètre P0 du cahier (F-21 est P2), livrée en mock.
- Pages privées `/groups` (liste, création) et `/groups/:id` (titres de la période, classement triable, courbe de progression de rang, meilleures parties).
- Contrat proposé dans `docs/back-groups-contract.md`. Le back est à écrire : collection `groups`, CRUD isolé par compte, route `compare`.
- « Meilleures actions de la partie » : le front compare la meilleure partie de chaque joueur par KDA. Les événements fins d'une partie (multi-éliminations, moments forts) ne sont pas dans le contrat.
- L'historique de rang de la comparaison est synthétique en mock. La source réelle reste à trancher avec le back (historique de parties ou snapshots).

## État du back relevé le 16/11/2026 (commit `7f88585`)

- Prêtes et testées côté back : health, Steam OpenID (`/auth/steam`, callback, `/auth/me`), recherche, profil, historique paginé des joueurs, CRUD des suivis, OpenAPI (`/api/openapi.json`, `/api/docs`), CORS, Docker Compose. Le front est aligné sur ces formes (copie figée dans `src/contracts/openapi.yaml`).
- `player.region` est un code pays Steam (`FR`) : le front le convertit en nom de pays. Le mock renvoie aussi `FR`.
- `rank` vaut `{ badgeId: null, name: null }` pour l'instant : le front affiche « Non classé » sans icône. Le mock simule le rang complet (tier, sous-rang, image) tel que proposé dans le contrat P1.
- `heroName` a un repli `Héros #<id>` côté back si le catalogue est indisponible, et il n'y a pas encore de `heroImageUrl` : les portraits de parties dépendent des routes P1.
- Pas encore côté back : héros, classement, détail de partie, carte, rangs, héros d'un joueur (P1) et groupes. Le front en mode réel affiche pour ces écrans l'état d'erreur ou vide, le mock reste la référence.

## Langue des données de jeu

Les données de jeu viennent de Deadlock API en anglais et restent en anglais (noms de héros, capacités, descriptions, histoire, rangs, rôles, équipes Amber Hand et Sapphire Flame). Seule l'interface (libellés, boutons, messages) est en français. Le script `scripts/build-fixtures.mjs` ne demande plus `language=french`.
