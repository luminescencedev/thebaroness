# Comparaison des requêtes API avant et après (18/11/2026)

Méthode : front `b2effca` (avant) contre le working tree (après), mode mock, Chromium 1440 px, chargement puis 3,5 s, compteur des requêtes `/api/*` (Playwright). Le mode développement double la plupart des requêtes ; seul l'écart compte.

| Parcours               | Avant | Après | Écart |
| ---------------------- | ----: | ----: | ----: |
| Accueil                |    18 |    18 |     0 |
| Profil, aperçu         |    27 |    23 |    -4 |
| Profil, onglet Héros   |    23 |    23 |     0 |
| Profil, onglet Parties |    29 |    25 |    -4 |
| Fiche héros            |     8 |     8 |     0 |
| Catalogue héros        |     2 |     2 |     0 |
| Catalogue items        |     6 |     6 |     0 |
| Fiche item             |     8 |     8 |     0 |
| Classement             |     4 |     4 |     0 |
| Recherche              |     4 |     4 |     0 |

## Détail du gain

`GET /heroes/:id/stats` sur le profil (aperçu et Parties) : **7 avant, 3 après**. Le joueur du mock n'a que 7 héros ; en production un joueur en a souvent plus de 12, l'économie atteint donc **9 requêtes** par ouverture d'un profil (12 avant, 3 après). L'onglet Héros garde la lecture complète (12), car il affiche l'écart face à la méta pour chaque ligne. Test : `metaRequests.test.tsx` (l'aperçu lit au plus 3 héros, l'onglet Héros étend jusqu'à 12).

## Ce qui n'a pas pu baisser

- Accueil : 7 lectures de méta (pas de liste groupée côté back).
- Mes suivis : 2 requêtes par joueur suivi (pas de réponse groupée) ; non mesuré ici (route authentifiée) mais le code est inchangé.
- Profil : 8 endpoints par scope (overview, héros, parties, activité, rang, relations, tendance, profil) : chacun porte une donnée distincte, aucune requête redondante.

## Comparaison visuelle

Captures avant/après dans `screenshots/` (profil aperçu, Héros, Parties, accueil, classement, à 1440 et 390 px). Contenu, chiffres et composition identiques (57,50 %, KDA 3,24, 40 parties, 1 068 de valeur nette, mêmes lignes). Les captures « avant » ont été prises sur une copie d'archive git sans les polices du projet (repli sans-serif), d'où une typographie différente : ce n'est pas un écart du code.
