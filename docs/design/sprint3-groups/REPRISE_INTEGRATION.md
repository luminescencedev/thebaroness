# Reprise de l'intégration backend des groupes (Sprint 3.1)

> **TERMINÉ le 19/11/2026 (Sprint 3.2).** Le back v1.15.0 a livré les six demandes et elles sont intégrées (voir `RAPPORT.md`, section « Sprint 3.2 », et `docs/back-groups-contract.md`). Ce document est conservé comme procédure de reprise générique.

À lire en premier par la session Claude Code qui reprend ce travail (autre poste, autre session). Le front est à jour de tout ce qui ne dépend pas du back ; il reste à intégrer ce que le back livre.

## Où on en est (19/11/2026)

- Front : Sprint 3 livré (`3bfe963`) et corrections indépendantes du Sprint 3.1 faites (graphique accessible, échantillons compacts, présentation intermédiaire, états de mise à jour). Voir `RAPPORT.md`, section « Sprint 3.1 ».
- Back au moment de l'écriture : `main` = `479348f` (v1.14.0). **Aucune des demandes de `docs/back-groups-sprint3-requests.md` n'était livrée** : `GET /groups` n'a pas `include`, `compare` n'a ni `include=pairs`, ni `gameMode`/`matchMode`, ni `unavailable[]`, ni période précédente (vérifié dans `docs/openapi.yaml` du back). Rien n'a donc été intégré ni simulé.

## Première étape : savoir ce que le back a réellement livré

1. `git -C ../thebaroness-back fetch && git -C ../thebaroness-back log origin/main --oneline -10`, puis fast-forward si l'arbre est propre (ne rien modifier d'autre dans le back).
2. Lire dans le back : `docs/HANDOFF.md`, `docs/openapi.yaml` (routes `/groups`, `/groups/{id}/compare`, schémas `Group*`), le rapport et le handoff front des groupes. **L'OpenAPI fait foi pour les DTO**, pas `docs/back-groups-sprint3-requests.md` (proposition du front, que le back a pu modifier ou refuser).
3. Recopier `docs/openapi.yaml` dans `src/contracts/openapi.yaml` (garder l'en-tête de source et de commit), puis typer dans `src/api/types.ts`.
4. Ne traiter que ce qui existe. Pour chaque demande, noter dans `docs/HANDOFF.md` : livrée, modifiée, reportée ou refusée.

## Plan d'intégration par demande (si livrée)

| Demande                                                   | Où brancher                                                                                                              | Points d'attention                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-1 identité des membres (`GET /groups?include=members`) | `src/api` (`listGroups`), `features/groups/hooks.ts` (`useGroups`), `pages/GroupsPage.tsx` (`memberPreview`, `GroupRow`) | une seule requête, aucune par membre ; avatars absents ou compte non résolu (`displayName` = SteamID) ; garder l'alias de vos suivis quand il existe ; lignes compactes : 3 avatars et « A, B et 3 autres »                                                                                         |
| P1-2 parties jouées ensemble (`include=pairs`)            | nouvelle section « Jouer ensemble » dans `GroupDetailPage`, composant dédié dans `features/groups/`                      | distinguer « aucune partie observée », « donnée absente », « source partielle » via `coverage` ; ne jamais dire qu'une paire n'a jamais joué ensemble si la source est tronquée ; pas de score de synergie ; chargement **à la demande** si le coût est élevé (une seule requête, pas de variantes) |
| P1-3 filtres `gameMode` / `matchMode` sur `compare`       | `useGroupCompare` (clé de cache), `GroupDetailPage`                                                                      | réutiliser les valeurs et libellés du profil (`features/players/scope`) ; clés de requête complètes (période + modes) ; URL (`?period=&mode=`) sans casser le retour arrière ; adapter le texte « modes confondus » de « Méthode et limites » à `appliedFilters`                                    |
| P1-4 `unavailable[]`                                      | `GroupDetailPage` (alerte « membres indisponibles », aujourd'hui déduite par `unavailableIds`)                           | raisons : introuvable, source indisponible, quota ; message générique pour une raison inconnue ; aucun détail technique                                                                                                                                                                             |
| P2-1 période précédente                                   | `ComparisonTable` (indicateur compact) ou panneau secondaire                                                             | uniquement si le back fournit la variation ou `previous` avec effectif suffisant ; jamais de « progression significative » sans justification                                                                                                                                                       |
| P2-2 remise à zéro des rangs                              | `RankProgress`                                                                                                           | n'afficher un marqueur ou une rupture que si le back le confirme ; sinon laisser la courbe telle quelle                                                                                                                                                                                             |

Chaque intégration : mocks MSW alignés sur l'OpenAPI (`src/mocks/handlers.ts` + `synthetic.ts`), contrat à jour dans `docs/back-groups-contract.md`, tests ciblés (`src/pages/groups.test.tsx`, `src/features/groups/*.test.ts`), vérification sur un back local (voir ci-dessous), captures à 1440, 1024, 768, 390 et 320 px.

## Vérifier sur un vrai back sans rien modifier dans le dépôt du back

Pas de Docker nécessaire : un script hors dépôt lance le back du dépôt (`tsx src/index.ts`) avec le `mongodb-memory-server` de ses `node_modules`, un `JWT_SECRET` aléatoire, un utilisateur inséré dans MongoDB et un jeton signé localement (à ne jamais afficher). Le front se lance en `npm run dev -- --port 5175` (proxy vers le port 3001) et se connecte par `/auth/callback#token=…`. Attention au quota de la Deadlock API : un classement à froid prend 10 à 15 s ; un groupe de 6 joueurs environ 4 s à froid.

## Rappels de règles

Développement sur `main`, aucun commit ni push sans autorisation explicite (un push sur `main` peut déclencher Coolify), ne pas modifier le dépôt du back, pas de mock présenté comme disponible en production, valeur inconnue = `n/d`, interface en français sans tiret cadratin ni emoji, pas de co-auteur Claude dans les commits.
