# Contrat front/back : routes P1 (catalogue, classement, partie)

Proposition du front pour les écrans P1 du cahier (F-16 à F-20). Les formes sont dans `src/api/types.ts` (section P1) et les exemples dans les fixtures de `src/mocks/fixtures/`. Les images viennent du catalogue Deadlock (`assets-bucket.deadlock-api.com`) : le back les normalise et renvoie des URLs complètes, le front ne les construit jamais. Les textes sont demandés en français (`?language=french` côté Deadlock API).

| Route                                | Réponse                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `GET /api/heroes`                    | `{ items: HeroSummary[], meta }`                                                                           |
| `GET /api/heroes/:heroId`            | `{ hero: HeroDetail, meta }`, 400 si id invalide, 404 si inconnu                                           |
| `GET /api/heroes/:heroId/stats`      | `{ stats: HeroMetaStats, meta }` (taux de victoire et de choix, par rang)                                  |
| `GET /api/ranks`                     | `{ items: RankTier[] }` : 12 rangs (0 à 11), image du rang et des 6 sous-rangs                             |
| `GET /api/map`                       | `{ minimap, tunnels, frame }` : visuels de la carte                                                        |
| `GET /api/leaderboard?region=Europe` | `{ region, items: LeaderboardEntry[], meta }`, régions `Europe`, `Asia`, `NAmerica`, `SAmerica`, `Oceania` |
| `GET /api/matches/:matchId`          | `{ match: MatchDetail, meta }`, 404 si inconnue                                                            |
| `GET /api/players/:steamId/heroes`   | `{ items: PlayerHeroStat[], meta }` : parties, victoires, taux de victoire et KDA par héros                |

Ajouts optionnels à des DTO P0 (rétrocompatibles) :

- `MatchSummary.heroImageUrl` : portrait du héros.
- `PlayerRank` : `tier`, `subrank`, `imageUrl`, `color` en plus de `badgeId` et `name`.

Notes :

- Le catalogue (héros, rangs, carte) change rarement : cache long côté back (cahier 9.2, 24 h).
- Les statistiques inconnues sont `null`, jamais 0. `winRateByTier[].winRate` est `null` si l'échantillon est trop faible.
- Les joueurs du classement n'ont pas forcément de `steamId` : le front n'affiche alors pas de lien vers un profil.
- Les courbes de progression du profil sont calculées par le front à partir de `GET /api/players/:steamId/matches` (taux de victoire cumulé, KDA par partie), sans route dédiée.
