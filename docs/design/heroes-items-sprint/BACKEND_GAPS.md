# Écarts et demandes au back (sprint Héros, Builds et Items)

Aucune demande bloquante. Le front fonctionne avec le contrat 1.11.0.

## Non bloquant, utile

1. **Pickrate d'item** : `/items/stats` donne `matches` (parties avec achat) sans le nombre de parties observées. Le front affiche donc un volume d'achats, jamais un pourcentage de choix. Un champ `observedMatches` (dénominateur) ouvrirait un vrai taux.
2. **Auteur des builds** : `authorSteamId` est affiché tel quel. Savoir s'il s'agit d'un SteamID64 permettrait de lier vers `/players/:id` et d'afficher un pseudo. Question : est-ce bien un SteamID64 ?
3. **`/items/stats` par héros** : le catalogue n'expose pas de filtre héros dans l'interface (une requête par héros serait un N+1). Le filtre existe sur la fiche item.
4. **Items sous le seuil dans `/items/stats`** : on suppose qu'ils sont absents de la liste (pas de ligne à zéro). À confirmer.
5. **Libellés des catégories de build** : `categories[].name` null apparaît comme « Section sans nom ». Confirmer que null est possible en pratique.

## Confirmé sur le back réel `ebaabd2` (18/11/2026)

1. **Source lente sur 30 jours** : `GET /items/stats?period=30d` renvoie 503 (la source répond 504 sur `/v1/analytics/item-stats`, `retryAfter` 120) ; 7 jours fonctionne. Pendant le temps de repos de 120 s, même les requêtes 7 jours renvoient 503. Pas un bug du contrat, mais le défaut `30d` est fragile : envisager un repos par jeu de filtres, ou un repli sur 7 jours.
2. **`GET /ranks` a répondu 503** pendant les tests (même fenêtre d'instabilité de la source). Le graphique de winrate par rang dégrade proprement.
3. **Tier V** : 17 objets de boutique, coût 9 999, tous sans statistiques (sous le seuil, absents de `/items/stats`).
4. **Builds** : contenu libre non modéré (titres, descriptions, annotations).

Vérifié conforme : nullabilité des champs, `favorites` / `weeklyFavorites` selon le tri, `wins + losses = matches` sur toutes les paires et statistiques observées, 404 et 400 des routes.

Non vérifié : la version déployée en production (non interrogée).
