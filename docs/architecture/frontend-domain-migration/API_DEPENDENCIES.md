# Dépendances API par parcours (18/11/2026)

Requêtes mesurées en développement avec le mock (Playwright, page chargée puis 3,5 s). Le mode développement double certaines requêtes (rendu en mode strict et nouvelle tentative du service worker) : les valeurs absolues sont surestimées, la comparaison avant/après reste valable.

| Parcours               | Endpoints (back v1.11.0)                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accueil                | `/heroes`, `/heroes/:id/stats` (x7), `/leaderboard`, `/players/search`, `/ranks`                                                                                                          |
| Profil, aperçu         | `/players/:id`, `/overview`, `/heroes`, `/matches` (pages jusqu'à 50), `/activity`, `/rank-history`, `/relationships`, `/trends`, `/ranks`, catalogue `/heroes`, `/heroes/:id/stats` (x3) |
| Profil, onglet Héros   | idem aperçu avec `/heroes/:id/stats` jusqu'à x12                                                                                                                                          |
| Profil, partie dépliée | `/matches/:id` (clé partagée avec la page partie), `/items?type=upgrade` (une fois)                                                                                                       |
| Partie                 | `/matches/:id`, `/items?type=upgrade`                                                                                                                                                     |
| Fiche héros            | `/heroes/:id`, `/heroes/:id/stats`, `/ranks`, `/heroes/:id/builds`, `/heroes/:id/item-pairs`, `/items?type=upgrade`                                                                       |
| Items                  | `/items?type=upgrade`, `/items/stats`, `/items/:id`, `/items/:id/stats`, `/heroes`                                                                                                        |
| Mes suivis             | `/tracked-players`, puis `/players/:id` et `/players/:id/matches?limit=10` par joueur (2N requêtes)                                                                                       |
| Groupes                | `/groups`, `/groups/:id`, `/groups/:id/compare`, `/ranks`                                                                                                                                 |
| Classement             | `/leaderboard`, `/ranks`                                                                                                                                                                  |

## Contrats demandés au back (non livrés)

1. `GET /heroes/stats` (tous les héros, ou `?ids=`) : supprime 7 requêtes sur l'accueil et jusqu'à 12 dans le profil.
2. `GET /tracked-players/insights` : profil minimal et forme des 10 dernières parties par suivi, réponse partielle par joueur.
3. `GET /players/{id}/performance?period=&window=&metric=` : série métier (KDA, victoires glissantes, valeur nette par minute) avec couverture, au lieu de calculer sur 50 parties chargées.
4. `GET /groups/{id}/compare` : `rankDelta` par membre et `highlights`.
5. Partie : `netWorthRank` et `kdaRank` par joueur si ces badges doivent venir du serveur.

## Compatibilité

Aucun champ optionnel n'est supposé : les anciens back continuent de fonctionner (repli KP calculé, méta « n/d »).
