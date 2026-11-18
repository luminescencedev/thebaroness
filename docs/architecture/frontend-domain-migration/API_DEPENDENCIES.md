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

| Demande                               | Livré (v1.12.0 / v1.13.0)                                                                                      | Consommé                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Méta groupée pour le profil           | oui, dans `/players/:id/heroes` (`globalMeta`, `winRateVsMeta`, `metaContext`), pas d'endpoint `/heroes/stats` | oui (profil) ; accueil oui : `GET /heroes/stats` (v1.14.0) |
| `GET /tracked-players/insights`       | oui                                                                                                            | oui                                                        |
| Série de performance                  | oui, dans `/players/:id/trends` (`series`, `period`)                                                           | oui                                                        |
| `rankDelta` et `highlights` de groupe | oui                                                                                                            | oui                                                        |
| Rangs et distinctions de partie       | oui (`netWorthRank`, `kda`, `performanceTags`, `totals`, `result`)                                             | oui                                                        |
| Classement : rangs et avatars résolus | oui (`badge.badgeId`, `color`, `avatarUrl`, `coverage`)                                                        | rangs oui ; avatars réservés au sprint Classement          |
| Résumé par ligne d'historique         | oui (`include=summary`, v1.13.0)                                                                               | non adopté (voir `MIGRATION_REPORT.md`)                    |

## Nouvelles demandes (non bloquantes)

1. ~~Méta des héros en un seul appel~~ : livré (v1.14.0), consommé.
2. ~~Valeur nette par minute dans `summary`~~ : livré (v1.14.0), non consommé tant que `include=summary` n'est pas adopté.

## Compatibilité

Aucun champ optionnel n'est supposé : les anciens back continuent de fonctionner (repli KP calculé, méta « n/d »).

## Préparation du Sprint 2 : Classement et Recherche (état de la couche de données)

Aucune refonte UX dans cette étape ; seulement l'état technique, vérifié sur le back v1.13.0 local (classement Europe) et sur le mock.

| Sujet                           | État                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DTO `GET /leaderboard`          | Typé en entier : `rank`, `displayName`, `steamId` (null possible), `inferred`, `avatarUrl`, `badge` (`tier`, `subrank`, `name`, `imageUrl`, `badgeId`, `color`, null possible), `topHeroes`, `coverage` (`entries`, `withSteamId`, `inferredSteamId`, `withBadge`, `withAvatar`, `ranksComplete`) |
| Couverture réelle (Europe)      | 100 entrées, 98 avec SteamID, rang et avatar, 43 SteamID déduits parmi des homonymes                                                                                                                                                                                                              |
| Rangs                           | `badge.name` contient déjà le sous-rang (« Eternus 5 ») ; `rankLabel` le met en romain. `badge` null = aucun rang connu, y compris sur le profil : plus aucune relecture                                                                                                                          |
| `avatarUrl`                     | Typé et servi, **pas encore affiché** (sprint Classement)                                                                                                                                                                                                                                         |
| SteamID inconnu                 | Entrée non cliquable, jamais un lien inventé                                                                                                                                                                                                                                                      |
| Homonymes (`inferred`)          | Typé, **pas encore signalé dans l'interface** : à décider par le design (indicateur d'inférence)                                                                                                                                                                                                  |
| `coverage`                      | Typé, non consommé : prêt pour un message de couverture partielle (`ranksComplete` faux)                                                                                                                                                                                                          |
| Cache                           | `staleTime` 5 min ; premier appel à froid ~8,6 s mesuré (rangs) : l'écran de chargement du classement doit rester honnête                                                                                                                                                                         |
| Recherche : hooks               | Un seul hook (`usePlayerSearch`) pour palette, page et formulaire de groupe ; clé normalisée (casse, espaces)                                                                                                                                                                                     |
| Recherche : debounce            | 220 ms dans la palette et le formulaire de groupe ; la page de recherche lit l'URL (pas de frappe)                                                                                                                                                                                                |
| Recherche : annulation          | `AbortSignal` sur chaque requête ; test de rafale et d'annulation                                                                                                                                                                                                                                 |
| Recherche : contenu             | `/players/search` ne renvoie ni rang ni statistique (le back précise que le rang coûterait 2 appels par résultat) : toute carte de résultat enrichie est une décision de sprint, pas un oubli                                                                                                     |
| Récents                         | `localStorage` (`baroness:recent-players`, 5 entrées, SteamID validé), indépendants du réseau                                                                                                                                                                                                     |
| Navigation résultat vers profil | `/players/:steamId` ; une saisie de SteamID64 dans la palette ouvre directement le profil                                                                                                                                                                                                         |

### Actions nécessaires avant la refonte UX

1. Décider si les résultats de recherche affichent un rang (coût : 2 appels par résultat côté back) ou restent pseudo et avatar.
2. Décider du signalement des SteamID inférés (homonymes) dans le classement et la recherche.
3. Décider de l'usage de `coverage` (message si les rangs sont incomplets).
4. Prévoir l'état de chargement du classement à froid (~9 s).
