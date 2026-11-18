# Audit initial, sprint Héros, Builds et Items (18/11/2026)

Base : front `main` à `af255ae`, back `ebaabd2` (OpenAPI 1.11.0), aucun nouveau commit côté back.

## État avant le sprint

- `/heroes` : grille, recherche, rôles, tri, état dans `useState` (perdu au retour arrière).
- `/heroes/:heroId` : une page longue (bannière, histoire, capacités en popover, base, méta, graphique par rang). Aucune route ni donnée P2.
- `/items`, `/items/:itemId` : absentes. Aucun type pour `/items/stats`, `/items/{id}`, `/items/{id}/stats`, `/heroes/{id}/builds`, `/heroes/{id}/item-pairs`.
- Catalogue d'objets : `useItemCatalog` (`GET /items?type=upgrade`, 1 h) déjà partagé par le Match Detail et le profil.
- Shell : sidebar repliable (Match Detail V3), bouton retour global, fil d'Ariane via `crumbsFor`.

## Écarts de typage corrigés (OpenAPI 1.11.0)

| Champ                            | Avant     | Contrat                                |
| -------------------------------- | --------- | -------------------------------------- |
| `CatalogItem.name`               | `string`  | `string \| null`                       |
| `CatalogItem.type`               | non nul   | `upgrade \| ability \| weapon \| null` |
| `CatalogItem.isActive`           | `boolean` | `boolean \| null`                      |
| `ItemListResponse.clientVersion` | `number`  | `number \| null`                       |

Conséquence : Match Detail et `matchModel` replient sur « Objet n°id » quand le nom est null.

## Contrats P2 relus

- `ItemStats` : `matches`, `wins`, `losses` obligatoires ; `winRate`, `players`, `sold`, `sellRate`, `avgBuyTimeSeconds`, `avgSellTimeSeconds` nullables. Pas de dénominateur : aucun taux de choix possible.
- `GET /items/{id}/stats` : `stats: null` et `notes: ["below_source_threshold"]` sous 20 parties.
- `HeroBuild` : `favorites` rempli seulement avec `sort=favorites`, `weeklyFavorites` avec `sort=weekly_favorites`. `categories[].name` et `items[].annotation` nullables.
- `item-pairs` : `itemIds` (2), `matches`, `wins`, `losses`, `winRate` ; wins + losses peut différer de matches.

## Décisions d'architecture

- Une clé de cache unique `["items","upgrade"]` pour le catalogue (Match Detail, profil, builds, catalogue, fiche item).
- Une seule requête d'agrégats `/items/stats` par jeu de filtres, jointe au catalogue côté front (pas de N+1).
- Filtres et onglets dans l'URL (`q`, `role`, `sort`, `slot`, `tier`, `cost`, `shop`, `period`, `mode`, `hero`, `tab`, `build`).
- `placeholderData: keepPreviousData` sur les agrégats ; les titres décrivent les filtres réellement servis (`filters` de la réponse), jamais ceux de l'interface en attente.
