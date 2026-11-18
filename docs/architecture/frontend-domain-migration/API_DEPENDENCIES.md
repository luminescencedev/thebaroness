# Dépendances API par parcours (18/11/2026, back v1.13.0)

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

## Contrats demandés au back : état

| Demande                               | Livré (v1.12.0 / v1.13.0)                                                                                      | Consommé                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Méta groupée pour le profil           | oui, dans `/players/:id/heroes` (`globalMeta`, `winRateVsMeta`, `metaContext`), pas d'endpoint `/heroes/stats` | oui (profil) ; **accueil : non** (7 lectures restantes) |
| `GET /tracked-players/insights`       | oui                                                                                                            | oui                                                     |
| Série de performance                  | oui, dans `/players/:id/trends` (`series`, `period`)                                                           | oui                                                     |
| `rankDelta` et `highlights` de groupe | oui                                                                                                            | oui                                                     |
| Rangs et distinctions de partie       | oui (`netWorthRank`, `kda`, `performanceTags`, `totals`, `result`)                                             | oui                                                     |
| Classement : rangs et avatars résolus | oui (`badge.badgeId`, `color`, `avatarUrl`, `coverage`)                                                        | rangs oui ; avatars réservés au sprint Classement       |
| Résumé par ligne d'historique         | oui (`include=summary`, v1.13.0)                                                                               | non adopté (voir `MIGRATION_REPORT.md`)                 |

## Nouvelles demandes (non bloquantes)

1. Méta des héros en un seul appel (`GET /heroes/stats`) pour l'accueil.
2. Valeur nette par minute dans `summary` pour retirer `netPerMinute` des lignes de partie.

## Compatibilité

Aucun champ optionnel n'est supposé : les anciens back continuent de fonctionner (repli KP calculé, méta « n/d »).
