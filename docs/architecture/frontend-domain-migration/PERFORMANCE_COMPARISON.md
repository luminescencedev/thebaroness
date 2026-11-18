# Comparaison des requêtes API avant et après (18/11/2026)

Méthode : front `b2effca` (avant) contre le working tree (après), mode mock, Chromium 1440 px, chargement puis 3,5 s, compteur des requêtes `/api/*` (Playwright). Le mode développement double la plupart des requêtes ; seul l'écart compte. Les routes privées sont ouvertes par `/auth/callback#token=` (session en mémoire).

| Parcours               | Avant | Après |    Écart |
| ---------------------- | ----: | ----: | -------: |
| Accueil                |    18 |    18 |        0 |
| Profil, aperçu         |    27 |    20 |       -7 |
| Profil, onglet Héros   |    23 |    16 |       -7 |
| Profil, onglet Parties |    29 |    22 |       -7 |
| Page partie            |     4 |     4 |        0 |
| Classement             |     4 |     4 | 0 (mock) |
| Mes suivis (5 suivis)  |    15 |     6 |       -9 |

## Détail

- **Profil** : `GET /heroes/:id/stats` passe de 7 (tous les héros du joueur du mock) à 0 : la méta arrive dans `/players/:id/heroes`. En production un profil en lit jusqu'à 12 : l'économie atteint 12 requêtes.
- **Mes suivis** : de `1 + 2 x N` à `2` requêtes. Avec 5 suivis : `/players/:id` x5 et `/players/:id/matches` x5 remplacés par `/tracked-players/insights` x1. Avec 100 suivis : 200 requêtes de moins.
- **Classement** : le mock fournit les rangs dans la liste, donc aucun écart mesuré ; en production, chaque entrée sans rang et dans les 10 premières déclenchait `/players/:id` (jusqu'à 10). Test : `leaderboard.test.tsx` vérifie qu'il n'y en a plus, même pour une entrée sans rang.
- **Groupes** : une requête `/groups/:id/compare` inchangée ; les titres sont calculés par le back (aucune requête supplémentaire, moins de calcul côté React).
- **Accueil** : 7 lectures de méta toujours présentes (pas d'endpoint groupé).

## Comparaison visuelle

Captures avant/après dans `screenshots/` (profil, onglet Héros, Parties, accueil, classement, Mes suivis, groupe, partie ; `real-*` sur le vrai back). Contenu et composition identiques. Les captures « avant » ont été prises sur une copie d'archive git sans les polices du projet, d'où une typographie différente : ce n'est pas un écart du code. Seuls changements visibles voulus : groupe avec ex æquo (« ex æquo » et plusieurs noms), classement « Eternus V » (le back livre « Eternus 5 », l'ancien code affichait « Eternus 5 5 » en production), tendance « (tout l'historique) ».

## Étape de finalisation (aucun écart attendu)

Les changements de cette étape (catalogue d'objets mutualisé, `useHeroesMeta`, clé de recherche normalisée, `staleTime` du classement) ne changent pas le nombre de requêtes d'un premier chargement : accueil 18, profil 20, Mes suivis 6 (inchangés). Gains attendus à l'usage : une recherche saisie avec une autre casse ne relance plus de requête, et un retour sur une région de classement déjà vue dans les 5 minutes n'en relance aucune. Ces deux gains sont couverts par des tests de cache, pas mesurés en navigateur.
