# Contrat front/back : groupes et comparaison

Nouvelle fonctionnalité demandée côté produit : comparer des amis (classement, progression de rang, meilleures parties). Elle étend le cahier (F-21 « comparaison de joueurs » est classée P2). Formes dans `src/api/types.ts` (section Groupes), exemples dans le mock (`src/mocks/handlers.ts`, `src/mocks/synthetic.ts`).

## Collection `groups` (privée, Bearer JWT)

`{ _id, ownerId, name, steamIds: string[], createdAt, updatedAt }`. Mêmes règles d'isolation que `tracked_players` : filtre `ownerId` partout, 404 pour le groupe d'un autre compte.

| Route                                                | Réponse                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `GET /api/groups`                                    | 200 `{ items: Group[] }`                                |
| `POST /api/groups`                                   | 201 `Group`. Corps `{ name, steamIds }`                 |
| `GET /api/groups/:id`                                | 200 `Group`, 404                                        |
| `PATCH /api/groups/:id`                              | 200 `Group`. `name` et/ou `steamIds`, PATCH vide refusé |
| `DELETE /api/groups/:id`                             | 204 sans corps                                          |
| `GET /api/groups/:id/compare?period=7d\|30d\|season` | 200 `GroupCompareResponse` (période par défaut `30d`)   |

Validation (400 `INVALID_INPUT`, schéma strict) : `name` 1 à 60 caractères après trim ; `steamIds` de 2 à 20 SteamID64 (17 chiffres) uniques ; `id`, `ownerId`, timestamps interdits. Les membres n'ont pas à être dans les suivis de l'utilisateur.

## Réponse de comparaison

```json
{
  "group": {
    "id": "...",
    "name": "Équipe du vendredi",
    "steamIds": ["..."],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "period": "30d",
  "members": [
    {
      "steamId": "76561198000000010",
      "displayName": "NoxFox12",
      "avatarUrl": null,
      "rank": {
        "badgeId": null,
        "name": "Augure 2",
        "tier": 9,
        "subrank": 2,
        "imageUrl": "...",
        "color": "..."
      },
      "matches": 38,
      "wins": 25,
      "losses": 13,
      "winRate": 65.79,
      "kda": 3.16,
      "longestWinStreak": 8,
      "bestMatch": {
        "matchId": "...",
        "playedAt": "...",
        "heroName": "...",
        "heroImageUrl": "...",
        "kills": 16,
        "deaths": 2,
        "assists": 12,
        "netWorth": 44300,
        "kda": 14
      },
      "rankHistory": [{ "at": "2026-10-17T20:00:00.000Z", "score": 50 }]
    }
  ],
  "meta": { "fetchedAt": "...", "sourceUpdatedAt": null, "isStale": false, "isPartial": false }
}
```

- `score` d'un point de `rankHistory` : `tier * 6 + sous-rang` (sous-rang de 1 à 6). Il permet de comparer des joueurs entre eux et de calculer la progression : dernier score moins premier score de la période, en sous-rangs.
- `rankHistory` est trié du plus ancien au plus récent. Source possible : `ranked_display_badge` / `ranked_delta` de l'historique de parties (cahier 9), ou snapshots du back (`player_snapshots`, cahier 11.4). Sans source, renvoyer `[]` : le front masque la courbe et affiche « n/d ».
- `bestMatch` : meilleure partie de la période par KDA, `null` si aucune partie.
- Un membre dont les données sont indisponibles peut être omis de `members` avec `meta.isPartial = true`. Si tout est indisponible : 503 `SERVICE_UNAVAILABLE`.
- Le front calcule lui-même les « titres » (plus forte progression, meilleur taux de victoire, plus de victoires, meilleur KDA, plus longue série, plus belle partie) et le tri du classement : le back ne renvoie que des agrégats.
- Périodes : `7d` et `30d` glissantes jusqu'à maintenant, `season` depuis le début de la saison courante (ou toutes les parties disponibles si la saison n'est pas connue).
