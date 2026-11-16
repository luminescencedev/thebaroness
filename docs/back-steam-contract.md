# Contrat front/back : connexion Steam

À transmettre au responsable du backend. L'encadrant a validé une connexion Steam uniquement (plus d'email ni de mot de passe). Le front est déjà prêt et testé en mock.

État du back relevé au commit `af6aaa3` : `POST /api/auth/register` et `POST /api/auth/login` (email, bcrypt), `UserModel { email, passwordHash }`, suivis (modèle seulement), pas de CORS branché.

## Flux

1. Le front envoie le navigateur vers `GET /api/auth/steam` (navigation complète, pas un `fetch`).
2. Le back redirige vers Steam OpenID (`https://steamcommunity.com/openid/login`), avec `return_to` = le callback du back.
3. Au retour, le back vérifie la réponse auprès de Steam (`openid.mode=check_authentication`), extrait le SteamID64 de `openid.claimed_id`, puis crée ou retrouve l'utilisateur par `steamId`.
4. Le back signe un JWT (comme aujourd'hui : HS256, `sub` = id utilisateur) et redirige vers `<FRONT_URL>/auth/callback#token=<JWT>`.
   En cas d'échec : `<FRONT_URL>/auth/callback?error=<code>`.
5. Le front lit le fragment, appelle `GET /api/auth/me` avec le Bearer, et ouvre la session en mémoire.

Le jeton est dans le fragment (`#`) pour qu'il ne parte jamais dans une requête ni dans les logs.

## Routes à fournir

| Route                                                | Réponse                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `GET /api/auth/steam`                                | 302 vers Steam OpenID                                                           |
| callback, par exemple `GET /api/auth/steam/callback` | 302 vers `<FRONT_URL>/auth/callback#token=<JWT>` ou `?error=<code>`             |
| `GET /api/auth/me` (Bearer)                          | 200 `{ "id", "steamId", "displayName", "avatarUrl" }`, 401 `UNAUTHORIZED` sinon |

`PublicUser` devient `{ id: string, steamId: string, displayName: string, avatarUrl: string | null }`.
`steamId` reste une chaîne de 17 chiffres. `displayName` et `avatarUrl` viennent du profil Steam (via Deadlock API ou l'API Steam), avec un repli sur le steamId si indisponible.

## À modifier ou retirer

- Retirer `POST /api/auth/register`, `POST /api/auth/login`, `passwordHash`, bcrypt et `EMAIL_ALREADY_USED`.
- `UserModel` : `steamId` unique (`/^\d{17}$/`), `displayName`, `avatarUrl`.
- Les routes privées et `ownerId` des suivis ne changent pas (Bearer JWT, `sub` = id utilisateur).
- Variable d'environnement : `FRONT_URL` (par exemple `http://localhost:5173`), pour la redirection finale.

## Autres points relevés

- **CORS** : `CORS_ORIGIN` est dans l'env mais aucun middleware n'est branché dans `app.ts`. Nécessaire si le front n'utilise pas le proxy Vite.
- **Durée du jeton** : 15 min par défaut et pas de refresh. Le front n'a pas de reconnexion silencieuse : prévoir `JWT_EXPIRES_IN=1h` en développement, sinon recliquer sur Steam toutes les 15 min.
- **Routes manquantes** pour le front (contrat v1, cahier 19.3) : `tracked-players` (5 routes), `players/search`, `players/:steamId`, `players/:steamId/matches`, avec `DataMeta` (`fetchedAt`, `sourceUpdatedAt`, `isStale`, `isPartial`).
- Le front attend un champ optionnel `player.region` dans le profil (ajout rétrocompatible).

## Sécurité côté back

- Vérifier l'assertion OpenID auprès de Steam, ne jamais se fier au `claimed_id` seul.
- Valider `openid.return_to` et `openid.realm`.
- Ne pas journaliser le jeton ni l'URL de redirection finale.
