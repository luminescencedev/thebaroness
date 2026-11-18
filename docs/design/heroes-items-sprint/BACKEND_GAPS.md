# Écarts et demandes au back (sprint Héros, Builds et Items)

Aucune demande bloquante. Le front fonctionne avec le contrat 1.11.0.

## Non bloquant, utile

1. **Pickrate d'item** : `/items/stats` donne `matches` (parties avec achat) sans le nombre de parties observées. Le front affiche donc un volume d'achats, jamais un pourcentage de choix. Un champ `observedMatches` (dénominateur) ouvrirait un vrai taux.
2. **Auteur des builds** : `authorSteamId` est affiché tel quel. Savoir s'il s'agit d'un SteamID64 permettrait de lier vers `/players/:id` et d'afficher un pseudo. Question : est-ce bien un SteamID64 ?
3. **`/items/stats` par héros** : le catalogue n'expose pas de filtre héros dans l'interface (une requête par héros serait un N+1). Le filtre existe sur la fiche item.
4. **Items sous le seuil dans `/items/stats`** : on suppose qu'ils sont absents de la liste (pas de ligne à zéro). À confirmer.
5. **Libellés des catégories de build** : `categories[].name` null apparaît comme « Section sans nom ». Confirmer que null est possible en pratique.

## Non vérifié contre le vrai back

Docker n'est pas disponible dans cet environnement WSL (`docker: command not found`) : les nouvelles routes ont été validées contre l'OpenAPI 1.11.0 et des mocks MSW conformes, pas contre une instance du back. À refaire dès que le back tourne (voir « Mise en route » dans `docs/HANDOFF.md`).
