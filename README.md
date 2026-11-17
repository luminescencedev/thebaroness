# The Baroness, frontend

Frontend de **The Baroness**, site de statistiques pour le jeu Deadlock (projet Full Stack JS, EFREI M1).
Le dépôt contient aussi l'outillage, les design tokens, le client API et les mocks.
Écrans P0 implémentés : accueil, recherche, profil, authentification, suivis (CRUD), palette ⌘K. Le cahier des charges est dans [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md).

Le front n'appelle jamais l'API Deadlock directement : il parle uniquement à `baroness-back` (préfixe `/api`).

## Prérequis

- Node.js 22 ou plus (voir `.nvmrc`)
- npm

## Installation

```bash
nvm use            # optionnel
npm ci
cp .env.example .env.local   # optionnel
```

## Scripts

| Script                  | Rôle                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Serveur Vite sur http://localhost:5173, proxy `/api` vers le back |
| `npm run dev:mock`      | Idem, avec MSW : aucune dépendance au back                        |
| `npm run build`         | Typecheck puis build de production dans `dist/`                   |
| `npm run preview`       | Sert le build local                                               |
| `npm run lint`          | ESLint                                                            |
| `npm run format`        | Prettier (écriture)                                               |
| `npm test`              | Vitest (jsdom, MSW actif)                                         |
| `npm run test:coverage` | Vitest avec couverture                                            |
| `npm run typecheck`     | `tsc --noEmit`                                                    |

## Mode mock

```bash
npm run dev:mock
```

MSW intercepte `/api/*` dans le navigateur. Les données viennent de `src/mocks/fixtures/` et sont **synthétiques**.
Le CRUD des suivis est cohérent en mémoire (POST, GET, PATCH, DELETE) et revient à son état de départ au rechargement.

- Connexion : le bouton Steam ouvre directement une session fictive (utilisateur Corvid), sans passer par Steam
- Joueur d'exemple : Corvid, `76561198000000000`
- Scénarios déterministes (voir `src/mocks/scenarios.ts`) : recherche `vide` (aucun résultat), `indispo` (503), `limite` (429) ; profil `76561198000000001` (partiel), `76561198000000503` (503)

Le mock n'est jamais actif en production : le code MSW est retiré du build.
Les tests (`npm test`) utilisent les mêmes handlers via `msw/node`.

Le mock reproduit les règles de l'API v1.10.0 (profil V2 : `overview`, filtres serveur de `matches` et `heroes`, curseur lié aux filtres, activité, rang, coéquipiers, catalogue d'objets, horloge fixe `2026-11-16`). Les **objets, MVP et statistiques de partie** du mock sont synthétiques (signalés « exemple synthétique du mode démo ») ; le back réel les livre depuis la v1.10.0.

## Mode réel avec le back

1. Lancer `baroness-back` sur le port 3001 (voir son README).
2. `npm run dev`.

Vite proxifie `/api` vers `http://localhost:3001`. Pour viser un autre serveur, renseigner `VITE_API_BASE_URL`
(par exemple dans `.env.local`) ; le back doit alors autoriser l'origine du front en CORS.

| Variable            | Défaut | Rôle                               |
| ------------------- | ------ | ---------------------------------- |
| `VITE_API_BASE_URL` | `/api` | Base de l'API du backend           |
| `VITE_API_MODE`     | (vide) | `mock` active MSW en développement |

## Session

Le jeton JWT est gardé **en mémoire seulement** (`src/api/session.ts`). Pas de `localStorage`, pas de cookie :
un rechargement complet de la page demande une reconnexion. Un 401 sur une route privée vide la session.

Connexion **Steam uniquement** : le back gère OpenID et renvoie vers `/auth/callback#token=<JWT>`. Contrat des routes dans [`docs/decisions.md`](docs/decisions.md).

## Docker

```bash
docker build -t baroness-front .
docker run --rm -p 8080:8080 baroness-front
```

Build Vite puis serveur statique nginx (repli SPA, port 8080). La base de l'API est fixée au build :

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.exemple.test/api -t baroness-front .
```

Avec la valeur par défaut `/api`, placer un reverse proxy devant le front et le back.

## Structure

```text
src/
  app/          providers, router, layout racine
  pages/        une page par route
  features/     auth/ players/ matches/ tracked-players/ heroes/
  components/   ui/ (primitives), layout/ (Nav, Footer)
  api/          client HTTP typé, DTO, erreurs, session
  styles/       tokens.css, globals.css
  mocks/        handlers MSW, fixtures JSON
  test/         setup Vitest, utilitaires de rendu
docs/           cahier des charges, décisions, HANDOFF avec le back, pack Profil joueur V2 (`docs/design/player-profile-v2/`)
  contracts/    copie figée de l'OpenAPI du back (`src/contracts/openapi.yaml`, v1.10.0)
```

Les choix et écarts par rapport au cahier des charges sont dans [`docs/decisions.md`](docs/decisions.md).
