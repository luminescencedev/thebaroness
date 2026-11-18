# Demandes au back : groupes et comparaison (Sprint 3, 18/11/2026)

Document de liaison pour le Claude du back. Contexte : refonte des pages `/groups` et `/groups/:id` (rapport : `docs/design/sprint3-groups/RAPPORT.md`). Le front fonctionne **entièrement** avec le contrat v1.14.0 : aucune de ces demandes n'est bloquante (aucun P0). Rien ci-dessous n'est implémenté côté front tant que le back ne l'a pas livré, et rien n'est simulé en production.

Ce qui est confirmé par le code du back (`479348f`) est marqué **[code]** ; ce qui reste une hypothèse est marqué **[hypothèse]**.

## P1-1 : identité des membres dans `GET /groups` (le plus utile)

- **Problème** : la liste des groupes ne peut montrer ni avatars ni pseudos des membres. Le front ne connaît que les alias de vos suivis ; sinon il affiche seulement « 6 joueurs ». Résoudre les pseudos côté front coûterait un appel par membre (N+1, jusqu'à 20 par groupe).
- **UX permise** : aperçu des membres (3 avatars + pseudos) sur chaque ligne de la liste.
- **Proposition (additive)** : `GET /groups?include=members`. Sans le paramètre, réponse inchangée.

```json
{
  "items": [
    {
      "id": "…",
      "name": "Équipe du vendredi",
      "steamIds": ["76561198000000010", "…"],
      "createdAt": "…",
      "updatedAt": "…",
      "members": [
        { "steamId": "76561198000000010", "displayName": "NoxFox12", "avatarUrl": "https://…" },
        { "steamId": "76561198000000011", "displayName": "76561198000000011", "avatarUrl": null }
      ]
    }
  ]
}
```

- **Nullables / repli** : `avatarUrl` null si inconnu ; `displayName` = SteamID64 si le profil est indisponible (comme `relationships`). Un profil indisponible ne fait pas échouer la liste.
- **Source** : `deadlock.getSteamProfiles(ids)` en un seul appel groupé pour tous les `steamIds` de la page **[code : déjà utilisé par `relationships` et le classement]**. Cache 6 h recommandé (comme les avatars du classement).
- **Coût** : 1 appel groupé par chargement de la liste (jusqu'à 20 × nb de groupes ids, dédoublonnés).
- **Compatibilité** : sans `include`, identique à v1.14.0.
- **Tests** : profil indisponible, membre sans avatar, ids dupliqués entre groupes, groupe vide impossible (2 membres minimum).
- **Consommateur front** : `GroupsPage` (`memberPreview` / `GroupRow`).

## P1-2 : parties jouées ensemble (`pairs`) dans `GET /groups/:id/compare`

- **Problème** : on ne voit pas si les membres jouent réellement ensemble. Une comparaison de groupe répond à « qui est le plus fort ? » mais pas à « que vaut-on quand on joue en groupe ? ».
- **UX permise** : une section « Jouer ensemble » : paires de membres avec parties communes, victoires, taux de victoire, **uniquement en escouade**.
- **Source** : `GET /players/:id/relationships?sameParty=true` existe **[code : `relationships`, agrégats Deadlock API `mate-stats`, `sameParty` = « parties jouées dans le même groupe de matchmaking »]**. Elle donne, pour un joueur, ses coéquipiers fréquents avec `matches` et `wins` DU JOUEUR DEMANDÉ.
- **Limites à connaître [code]** : la liste est tronquée (`RELATIONS_MAX`, `limit` ≤ 50) et filtrée par `minMatches` (défaut 2) : un coéquipier rare d'un membre peut manquer. Un membre qui n'est pas dans le top de l'autre n'apparaît pas : afficher « aucune partie en escouade observée » serait faux, il faut dire « non observé ».
- **Ne pas appeler « partie en groupe » une partie commune** sans `sameParty=true` : sans ce filtre, `mates` = même équipe, pas forcément escouade **[code]**.
- **Proposition (additive)** :

```json
"pairs": {
  "scope": { "sameParty": true, "gameMode": "normal", "minMatches": 2 },
  "items": [
    { "steamIds": ["7656…10", "7656…11"], "matches": 31, "wins": 20, "losses": 11, "winRate": 64.52 }
  ],
  "coverage": { "membersQueried": 6, "membersResolved": 6, "truncated": false }
}
```

`pairs` absent ou `null` si la source est indisponible (jamais `[]` pour dire « pas de données »). `winRate` null sous 1 partie. Une paire n'est listée que si les deux directions concordent ou si une seule est disponible : indiquer laquelle dans `coverage` **[hypothèse : les deux sens peuvent différer d'une partie]**.

- **Coût** : jusqu'à N appels `mate-stats` pour N membres (≤ 20), cache de 10 min déjà en place sur `relations:v1` **[code]**. Prévoir un plafond (par exemple calcul à partir de 2 à 8 membres, ou paramètre `include=pairs` explicite) pour ne pas alourdir chaque comparaison.
- **Priorité** : P1 (forte valeur, non bloquant). Préférer `include=pairs` à un nouvel endpoint.
- **Tests** : 2 membres sans partie commune, escouade partielle, une source en échec, 20 membres.
- **Consommateur front** : nouvelle section de `GroupDetailPage` (non créée tant que le contrat n'existe pas).

## P1-3 : filtre de mode sur la comparaison

- **Problème** : `memberStats` agrège **toutes** les parties stockées sans distinguer le mode **[code : `memberStats` ne filtre pas sur `matchMode` ni `gameMode`]**. Un joueur qui fait beaucoup de Street Brawl voit son taux de victoire mélangé à celui du mode normal.
- **Proposition (additive)** : `GET /groups/:id/compare?period=&gameMode=&matchMode=` avec les mêmes valeurs et défauts qu'`/overview` (v1.9.0). Sans paramètre : comportement actuel. Exposer `appliedFilters` dans la réponse (comme `/players/:id/heroes`).
- **Source** : `StoredMatch.matchMode` / `gameMode` existent, optionnels sur les anciennes copies de cache **[code]** ; une partie sans mode doit compter dans « tous » seulement.
- **Coût** : nul (filtrage en mémoire sur l'historique déjà lu).
- **Priorité** : P1. Le front affiche déjà « modes de jeu confondus » dans « Méthode et limites » ; ce texte changerait selon `appliedFilters`.

## P1-4 : membres indisponibles nommés

- **Problème** : un membre dont les données manquent est **omis** de `members` avec `meta.isPartial` **[code : `Promise.allSettled`, omission silencieuse]**. Le front déduit les absents (`group.steamIds` moins `members`) mais ne sait pas pourquoi.
- **Proposition (additive)** : `unavailable: [{ steamId: "…", reason: "not_found" | "provider_error" | "rate_limited" }]`. `reason` permet de dire « profil introuvable » (définitif) ou « réessayez » (temporaire).
- **Coût** : nul. **Priorité** : P1 (petit, utile aux erreurs).

## P2-1 : variation par rapport à la période précédente

- **Besoin** : « le taux de victoire de X a progressé de 4 points depuis les 30 jours d'avant ».
- **Proposition (additive)** : `previous: { matches, winRate, kda, kdaSampleSize } | null` par membre (même fenêtre juste avant). Aucune delta calculée côté front : seulement `current` et `previous`, le back calcule l'écart et gère l'effectif minimum.
- **Source** : le même historique **[code : `StoredMatch.startTime`]**. Limite : l'historique stocké peut ne pas remonter assez loin pour 30 j + 30 j **[hypothèse à vérifier : profondeur de `historyOf`]**.
- **Priorité** : P2.

## P2-2 : marqueur de remise à zéro des rangs

- **Observation (données réelles, 18/11/2026, back local v1.14.0)** : pour 6 joueurs Eternus, la courbe `rankHistory` sur 30 jours chute pour **tous** vers Phantom 6 à la même période, puis remonte. Ce n'est pas une progression de joueurs. Cause **[hypothèse]** : réinitialisation de saison ou recalibrage du rang, jamais confirmée par le code.
- **Impact UX** : la courbe relie des points qui ne sont pas comparables (avant et après la remise à zéro) et `rankDelta` (dernier moins premier) en est faussé.
- **Proposition** : exposer dans `methodology` une liste `rankResets: [{ at: "…" }]` quand le back sait détecter un recalibrage, ou couper `rankHistory` par segments. À investiguer avant de choisir le contrat.
- **Priorité** : P2, mais à qualifier : si la cause se confirme, elle touche aussi `GET /players/:id/rank-history`.

## À écarter (décision produit)

Score composite « meilleur joueur » (opaque, contraire à « aucune donnée inventée »), distribution de rôles (données non fiables), ordre manuel des membres, rôles/invitations/groupes publics (aucune justification produit), comparaison par héros dans les groupes (déjà couverte par le profil).
