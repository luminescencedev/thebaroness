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
