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

## Mise à jour v1.15.0 (19/11/2026, Sprint 3.2)

Contrat : `src/contracts/openapi.yaml` (v1.15.0, back `f319777`). Tout est additif ; un back plus ancien reste affiché sans erreur (champs optionnels côté types, « n/d », aucun calcul de repli).

| Route                                                           | Ajout                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/groups?include=members`                               | `members[]` (`steamId`, `displayName`, `avatarUrl`, `resolved`) dans l'ordre de `steamIds`, `membersCoverage`, `meta`. Identité non résolue : `displayName` = SteamID64, `resolved: false`. Sans `include`, réponse inchangée. Le front l'envoie TOUJOURS : une requête pour toute la liste.                                                                                                                                   |
| `GET /api/groups/:id/compare` et `POST /api/groups/:id/refresh` | `gameMode` (`all`, `normal`, `street_brawl`), `matchMode` (`all`, `ranked`, `unranked`), `include=pairs`. Réponse : `appliedFilters`, `unavailable[]` (`not_found`, `rate_limited`, `timeout`, `provider_error`, `unknown`), `pairs`, par membre `excludedUnknownModeMatches`, `previous`, `deltaVsPrevious`, `rankHistory[].season` ; `methodology` : `rankDeltaScope`, `seasons`, `seasonBoundariesKnown`, `previousPeriod`. |
| `GET /api/players/:id/rank-history`                             | `seasons`, `points[].season`, notes `spans_multiple_seasons`, `season_boundaries_unknown`.                                                                                                                                                                                                                                                                                                                                     |

Règles côté front :

- La comparaison est clée par période ET modes (`["groups","compare",id,period,gameMode,matchMode]`). Période et modes vivent dans l'URL (`?period=&gameMode=&matchMode=`), mêmes clés et libellés que le profil (`ScopeBar`, `parseScope`). Le texte « modes confondus » n'apparaît que sous « tous ».
- Le périmètre affiché est celui de la RÉPONSE (`appliedFilters`), jamais celui de la demande en attente.
- `include=pairs` est envoyé avec chaque comparaison : mesuré +0,1 s pour 8 membres sur le back local (le coût est la lecture des historiques, déjà faite pour la comparaison). Une seule requête, aucune lecture à la demande.
- `deltaVsPrevious` est affiché tel quel (jamais recalculé) ; `null` donne « n/d » ; aucun écart pour `season` (`previous` null).
- Courbes de rang : jamais reliées d'une saison à l'autre (`season` change : nouveau segment) ; repère de saison issu de `methodology.seasons` ; `season` null partout (`seasonBoundariesKnown: false`) : courbe continue et avertissement dans « Méthode et limites ». La progression (`rankDelta`) ne porte que sur la dernière saison de la période.
- Parties jouées ensemble : « dans la même équipe », jamais « en escouade » (`partyConfirmed` est toujours false). Une paire absente de `items` n'a aucune partie commune scorée SI ses deux membres sont évalués ; un membre de `coverage.membersMissing` est « non évalué », pas 0.
- Membres indisponibles : raison en clair, sans détail technique (introuvable ; réessayez dans un instant ; données indisponibles).
