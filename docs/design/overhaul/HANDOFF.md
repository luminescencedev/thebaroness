# Implications pour le back

Aucune. Aucun DTO, route ni mock modifié. La landing appelle uniquement `GET /heroes`, `GET /heroes/:id/stats` (5 appels) et `GET /leaderboard?region=`.

Besoins éventuels (non bloquants) : un endpoint de joueurs « à découvrir » et un classement méta des héros (winrate / pickrate triés) permettraient de remplacer l'aperçu d'exemple et la sélection fixe des widgets.
