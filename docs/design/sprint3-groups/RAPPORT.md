# Sprint 3 : Groupes et comparaison de joueurs (18/11/2026)

Front sur `main` (base `49c06fb`), back v1.14.0 (`479348f`), aucun changement de contrat ni de back. Rien n'est commité à la date de ce rapport.

## 1. Audit initial

Fichiers lus : `GroupsPage`, `GroupDetailPage`, `GroupForm`, `compare.ts`, `hooks.ts`, `MultiLineChart`, handlers et fixtures du mock, contrat `docs/back-groups-contract.md`, et côté back `group.compare.ts`, `group.schemas.ts`, `group.service.ts`, `group.model.ts`, `relationships`.

- **Disponible et utilisé** : CRUD des groupes, `compare` (membres, `rankHistory`, `rankDelta`, `currentRankScore`, `kdaSampleSize`, `highlights`, `methodology`), actualisation forcée.
- **Disponible mais mal exploité** : `kdaSampleSize` (non affiché), `highlights[].minMatches` et `eligibleMembers`, `methodology`, `rank.color`.
- **Partiellement disponible** : identité des membres (seulement dans `compare`, pas dans `GET /groups`).
- **Absent** : parties jouées ensemble, filtre de mode sur la comparaison, membres indisponibles nommés, variation par période.

Contraintes du back confirmées par le code : nom 1 à 60 caractères, 2 à 20 `steamIds` uniques, formats acceptés = SteamID64, code ami, `[U:1:n]`, URL `/profiles/<id>` (pas les liens `/id/pseudo`) ; un membre dont les données manquent est **omis** de `members` ; `memberStats` agrège tous les modes de jeu ; seuil des titres de ratio = 5 parties.

## 2. Problèmes UX (priorisés)

1. **Haute** : le mur de 6 cartes de « titres » repoussait la comparaison sous le pli (4 écrans à 390 px) alors que la comparaison est la raison d'être de la page.
2. **Haute** : la « position » était l'index du tableau : deux joueurs à égalité avaient 1 et 2. Aucune taille d'échantillon visible : « 100 % » sur 3 parties paraissait aussi fiable que sur 300.
3. **Haute** : un membre indisponible disparaissait sans un mot.
4. **Moyenne** : la liste montrait des SteamID64 bruts quand un membre n'est pas dans vos suivis ; pas d'avatars ; pas de filtre au-delà de quelques groupes.
5. **Moyenne** : formulaire incohérent (`maxLength` 80 contre 60 côté back), recherche sans signalement des homonymes, joueur déjà ajouté simplement masqué, **saisie qui se mélangeait à la suivante après un doublon** (bug), erreurs serveur limitées à 400 et 409.
6. **Moyenne** : « Supprimer » (danger) à côté des actions courantes ; pas d'erreur de suppression affichée.
7. **Basse** : courbe : axe qui dépassait l'échelle (voir §11), joueurs sans courbe non nommés, légende sans lien avec le tableau.

## 3. Recherche produit

- **Comparaison individuelle** : rang, progression, victoires/défaites, taux, KDA, série et meilleure partie suffisent pour une comparaison honnête. Comparables seulement avec leur effectif : taux de victoire et KDA (affichés avec le nombre de parties). Trompeurs : un taux sur peu de parties, une progression sur 2 observations, un KDA moyen mélangeant les modes.
- **Performances collectives** : faisable côté back (`relationships?sameParty=true`) mais pas exposé au niveau d'un groupe. Une partie commune sans `sameParty` signifie « même équipe », pas escouade. Demande P1-2 documentée, non simulée.
- **Progression** : 7 j, 30 j, saison déjà fournis ; « n/d » sous 2 observations.
- **Titres** : conservés tels que le back les calcule ; un titre de ratio n'existe qu'à partir de 5 parties, le front l'affiche.
- **Gestion des groupes** : pas d'ordre manuel, de rôles ni de permissions (aucune justification produit).

## 4. Benchmark

Limites : lecture des **pages d'accueil seulement**, via un résumé produit par un petit modèle (pas le DOM). Aucune page de comparaison ou de profil vue.

| Site                                  | Accessible           | Observé                                                                     |
| ------------------------------------- | -------------------- | --------------------------------------------------------------------------- |
| Deadlock Tracker                      | accueil              | classement hebdomadaire avec « Tracked Matches » à côté du taux de victoire |
| Tracklock                             | accueil              | tableaux courts avec colonne « Change », séparés par mode et par patch      |
| Statlocker                            | accueil              | plusieurs classements ; l'échantillon n'apparaît que dans la FAQ            |
| OP.GG multisearch                     | formulaire seulement | 5 joueurs maximum ; résultats non vus                                       |
| League of Graphs, dpm.lol, Mobalytics | non (HTTP 403)       | non inspectés                                                               |
| Tracker.gg, Blitz                     | non tentés           | non inspectés                                                               |

Idées retenues : effectif à côté du taux (appliqué), période de référence sur chaque tableau (appliqué), tableaux courts. Écarté : notes composites (pas de donnée comparable, contraire au principe du projet). Ce qui n'a pas pu être vérifié (fonction « coéquipiers », multisearch réel) reste non vérifié.

## 5. Variantes comparées

Prototype interactif (non intégré aux routes) : https://claude.ai/artifact/Fs6qFxTb1cc15NniZx1e4A (liste, détail A et B, groupe de 2, 5 et partiel, formulaire, 5 largeurs).

| Critère         | A : comparaison d'abord                     | B : synthèse d'abord                               |
| --------------- | ------------------------------------------- | -------------------------------------------------- |
| Compréhension   | la réponse à « qui est où ? » est immédiate | il faut passer les faits pour atteindre le tableau |
| Mobile (390 px) | tableau visible dès le premier écran        | 3 à 4 écrans de faits avant la comparaison         |
| Densité         | faits en liste dense sous le tableau        | bande de cartes, plus d'espace perdu               |
| Utilité         | faits comme complément                      | faits mis en avant mais sans contexte              |

**Direction retenue : A**, avec les faits marquants en **liste dense** (pas de cartes). Raison : la page existe pour comparer ; B reproduisait le défaut principal de l'ancienne page.

## 6. Fonctionnalités implémentées

- **`/groups`** : liste dense (une seule carte, lignes de 68 px, tout le bloc est le lien), nombre de joueurs, aperçu des noms connus (alias des suivis, jamais d'appel de plus), « Modifié il y a… », filtre par nom à partir de 8 groupes, états chargement, vide, erreur avec réessai.
- **Formulaire** (dialogue conservé : le plus simple et il fonctionne à 390 px) : nom limité à 60, compteur « n sur 20 · 2 minimum », sélection en lignes avec avatar connu et retrait tactile (36 px), recherche partagée `usePlayerSearch` avec signalement « même pseudo » (règle de `features/search`), joueur déjà dans le groupe grisé, doublon signalé (« est déjà dans le groupe ») sans corrompre la saisie, ids directs (SteamID64, code ami, `[U:1:n]`, `/profiles/<id>`), erreurs serveur affichées (400, 409, 5xx, 429), saisie conservée en cas d'échec.
- **`/groups/:id`** : en-tête (nom, joueurs, période, fraîcheur ; Actualiser et Modifier visibles, **Supprimer dans un menu « ⋯ »**), tableau comparatif (rang avec couleur, progression ▲ ▼ ou « Stable » ou « n/d », victoires, taux **avec nombre de parties** et « échantillon faible » sous le seuil, KDA avec son échantillon), tris, **positions avec ex æquo** (1, 2, 2, 4) calculées sur la valeur du critère, inconnu sans position, pastille de couleur par joueur (stable quel que soit le tri) liée à la courbe, faits marquants en liste dense avec seuil et ex æquo, courbe de progression (axe borné à l'échelle de rang 1 à 72, joueurs sans courbe nommés), meilleures parties en liste avec lien vers Match Detail, « Méthode et limites » repliable (modes confondus, effectifs différents, ex æquo), membres indisponibles nommés, comparaison partielle annoncée, actualisation en échec avec les données précédentes.
- **Conservé** : hooks et query keys (`["groups", …]`), actualisation toutes les 3 min et au retour sur l'onglet, `keepPreviousData` au changement de période, composants UI, `MultiLineChart` (ajout de `min` et `max` optionnels).
- **Supprimé** : le mur de cartes de titres, les cartes de la liste, l'ancien tableau avec défilement horizontal.
- **Écarté** : score composite, ordre manuel, rôles et invitations, parties communes (en attente du back), variation de période (en attente du back).

## 7. Composants

Nouveaux : `ComparisonTable`, `FactsList`, `BestMatches`, `RankProgress`, `GroupMenu`, `colors.ts`, `limits.ts` (dans `src/features/groups/`). Modifiés : `GroupsPage`, `GroupDetailPage`, `GroupForm`, `compare.ts` (`positionMembers`, `sortValue`, `unavailableIds`, `isLowSample`, `highlightRows`), `MultiLineChart` (`min`/`max`), tests. Mise en page par container queries (la sidebar change la largeur utile) : tableau à partir de 820 px de conteneur, lignes à deux niveaux en dessous.

## 8. Contrats consommés

`GET /groups`, `POST /groups`, `PATCH /groups/:id`, `DELETE /groups/:id`, `GET /groups/:id/compare?period=`, `POST /groups/:id/refresh`, `GET /players/search`, `GET /tracked-players`, `GET /ranks`. Aucun nouvel endpoint. Champs nouvellement exploités : `kdaSampleSize`, `rank.color`, `methodology.highlightMinMatches` et `periodFrom`, `highlights[].minMatches`.

## 9. Tests

- Typecheck, lint, build : OK. **Vitest : 228 tests** (207 avant le sprint), tous réussis. Nouveaux : `positionMembers` (ex æquo, inconnu, progression 0 contre null), membres indisponibles, échantillon faible ; pages groupes : liste (lignes, vide, filtre, erreur), formulaire (validation, doublon, création, erreur serveur, homonymes), comparaison (tri et ex æquo, n/d, membre indisponible, faits et meilleures parties, courbe, changement de période, 404 et 429, suppression avec erreur puis succès).
- **E2E Playwright** : 31 réussis, 5 ignorés (ignorés en mobile par conception) ; nouveau parcours `e2e/groups.spec.ts` : liste, comparaison, tri, période, création de groupe, suppression.
- Un **bug réel** a été trouvé par les tests et corrigé : après un doublon, la saisie restait dans le champ et se concaténait avec le SteamID suivant.

## 10. Validation sur les vraies API

Back **local** v1.14.0 (code du dépôt, MongoDB en mémoire, aucune modification du back), Deadlock API réelle, utilisateur de test avec jeton signé localement. Classement Europe (15 s à froid), groupes de 2 et de 6 joueurs, comparaisons 30 j (4,1 s à froid pour 6 membres) et 7 j. Schémas conformes ; `kdaSampleSize` égal à `matches` ; `rankDelta` souvent 0 pour des joueurs Eternus (rang plafonné) ; ex æquo de rang nombreux. Ce que les fixtures ne montraient pas : jusqu'à 394 points de rang par membre, des colonnes « Victoires » qui débordaient avec des centaines de parties (corrigé), un axe de rang dépassant 72 (corrigé), et une chute de rang simultanée de tous les joueurs (demande P2-2). Les états d'erreur, partiel et quota viennent de fixtures, pas du back réel.

## 11. Vérification visuelle

Chromium, 1440, 1024, 768, 390 et 320 px, mock puis back réel : liste, détail, formulaire (1440 et 390), recherche de joueur dans le formulaire, 5 joueurs et 6 joueurs réels, courbe, meilleures parties. Aucun débordement horizontal ; lisibilité, hiérarchie et zones tactiles contrôlées. Captures : `docs/design/sprint3-groups/captures/` (mock et prototype). Captures sur données réelles : `captures-reel/` (pseudos Steam réels : **ne pas committer**).
Écart avec le prototype : à 1024 px la page utilise les lignes à deux niveaux (conteneur inférieur à 820 px) ; le prototype montrait le tableau complet à partir de 1024 px de fenêtre.

## 12. Performances

Liste : 1 appel `GET /groups` (+ liste des suivis déjà en cache), aucun appel de statistiques. Détail : 1 `compare` (+ rangs et suivis en cache) ; changer de période relance un `compare` ; relecture douce toutes les 3 min. Aucune requête N+1 ajoutée.

## 13. Limites connues

Pas de lecteur d'écran ni de zoom navigateur testés ; la courbe n'a pas de navigation clavier ni de tableau de données (limite héritée de `MultiLineChart`) ; le menu « ⋯ » et le dialogue reposent sur Base UI, vérifiés au clavier par les tests de rôles uniquement ; l'aperçu des membres dans la liste est limité aux alias de vos suivis (P1-1).

## 14. Dette technique restante

Erreur React existante « deux enfants avec la clé `Mes suivis` » (navigation, hors périmètre) ; accessibilité de la courbe ; l'ancienne marque (loader, favicon, Open Graph).

## Sprint 3.1 : stabilisation (19/11/2026)

**Backend au démarrage** : `main` = `479348f` (v1.14.0), aucun commit depuis le Sprint 3. Aucune des demandes (`include=members`, `include=pairs`, `gameMode`/`matchMode` sur `compare`, `unavailable[]`, période précédente, remise à zéro des rangs) n'est livrée (OpenAPI vérifiée). **Rien n'a été intégré ni simulé.** Plan de reprise : `REPRISE_INTEGRATION.md`.

Corrections indépendantes faites :

- **Graphique accessible** : `MultiLineChart` est focalisable, les flèches, Début, Fin et Échap déplacent un curseur dont les valeurs sont annoncées (zone `aria-live`) ; la progression des groupes passe par `ChartFrame` : « Voir les données » donne un tableau (premier et dernier rang observés, nombre d'observations) et un résumé lu aux lecteurs d'écran. Amélioration partagée : le graphique du profil en profite aussi ; tests dédiés (`MultiLineChart.test.tsx`).
- **Échantillons sur mobile** : taux et KDA affichent leur effectif entre parenthèses dans les lignes compactes (« sur N parties » annoncé aux lecteurs d'écran) et une légende l'explique.
- **Présentation intermédiaire** : évaluée à 1024 et 768 px, les lignes à deux niveaux laissaient la moitié droite vide. Un niveau moyen (conteneur de 560 à 820 px) place rang et progression à droite du nom et les victoires, taux et KDA sur la ligne suivante. Le tableau complet reste réservé aux conteneurs de 820 px et plus, pour ne pas déborder avec la sidebar.
- **États** : pendant un changement de période, un message dit que les chiffres affichés sont ceux de la période précédente ; une relecture en cours est signalée ; une actualisation refusée (quota, délai de 60 s) affiche un message ; une période qui échoue n'affiche plus le tableau d'une autre période et la période reste modifiable.

Tests : 21 pour les pages groupes, 3 pour le graphique, tout le reste inchangé ; E2E des groupes inchangé.

## Sprint 3.2 : intégration du back v1.15.0 (19/11/2026)

**Backend** : `main` = `f319777` (v1.15.0), contrat copié dans `src/contracts/openapi.yaml`. Les six demandes sont livrées (voir le tableau en tête de `docs/back-groups-sprint3-requests.md`).

Intégré :

- **Liste des groupes** : `GET /groups?include=members`, une seule requête pour toute la liste, aucune par membre. Trois avatars et « A, B et N autres » ; l'alias de vos suivis passe avant le pseudo du back ; identité non résolue : « Joueur 0099 », jamais le SteamID brut en guise de pseudo ; repli sur le nombre de joueurs avec un back plus ancien.
- **Période et modes** : période, format et type dans l'URL (mêmes contrôles et libellés que le profil), clé de cache complète, périmètre affiché = celui de la réponse (`appliedFilters`) ; « modes confondus » seulement sous « tous » ; parties au mode inconnu écartées annoncées dans « Méthode et limites ».
- **Membres indisponibles** : la liste vient du back avec une raison en clair (introuvable ; réessayez dans un instant ; données indisponibles), sans détail technique.
- **Période précédente** : `deltaVsPrevious` affiché tel quel dans le tableau (pastilles de variation sous le taux et le KDA, sur les lignes compactes aussi), « n/d » sous 5 parties de chaque côté, aucun écart pour « saison », fenêtre comparée nommée.
- **Jouer ensemble** : nouvelle section, « dans la même équipe », jamais « en escouade ». Chargée avec la comparaison (`include=pairs`) : mesuré +0,1 s pour 8 membres, donc une seule requête et pas de bouton. Paires triées par parties, échantillon faible signalé, adversaires mentionnés, membres « non évalués » nommés (jamais comptés à 0), absence de la donnée distinguée d'une absence de parties.
- **Saisons classées** (cause établie par le back : changement de saison du 05/11/2026 20:00 UTC, la source recompresse les rangs) : la courbe de rang des groupes est coupée à chaque changement de saison (segments, jamais reliés), repère de saison, explication, progression limitée à la dernière saison ; saisons indisponibles : courbe continue et avertissement. Même traitement sur la courbe de rang du PROFIL (`rank-history`), qui était concernée.

Composants : `MultiLineChart` (segments par `segment`, repères `markers`, point isolé visible), `PairsSection`, `ComparisonTable` (écarts), `GroupsPage` (avatars).

Vérifié sur un back local v1.15.0 (copie hors dépôt, MongoDB locale, utilisateur inséré) : liste avec identités (3 résolus sur 4, un SteamID inconnu : `resolved: false`), comparaison 30 jours (2 saisons, un membre `not_found`, `meta.isPartial`), filtres normal/classée (394 et 188 parties), saison (`previous` null), Street Brawl 7 jours, `gameMode` invalide (400), `include` invalide (400), paires (1 paire commune, un membre non évalué), 8 membres à froid : 0,9 s la comparaison, +0,1 s les paires. Captures réelles dans `captures-3-2/` : 1440, 1024, 768, 390, 320 px (liste, détail, filtre classée, saison), aucun débordement horizontal.

Tests : 264 (21 pages groupes inchangées, 13 nouveaux pour la v1.15.0, 7 pour le mock, 3 pour le graphique, 3 pour la courbe du profil).

Limites : avatars Steam non chargés dans l'environnement de test (initiales de repli) ; les écarts de période précédente d'un joueur sans historique avant la fenêtre restent « n/d » ; le nom d'un membre indisponible est son alias ou son SteamID (la liste des groupes ne fournit pas ses identités à la page de détail).

## BACKEND GAP ANALYSIS

| Fonctionnalité                                    | Valeur utilisateur                       | Disponibilité actuelle                                | Faisabilité                                           | Coût                   | Priorité | Décision                         |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ---------------------- | -------- | -------------------------------- |
| Identité des membres dans `GET /groups`           | élevée (reconnaître ses groupes)         | absente                                               | confirmée (profils groupés déjà utilisés)             | 1 appel groupé         | P1       | À DÉVELOPPER (`include=members`) |
| Parties jouées ensemble (`pairs`)                 | élevée (valeur propre aux groupes)       | partielle : `relationships?sameParty=true` par joueur | confirmée avec limites (liste tronquée, `minMatches`) | N appels, cache 10 min | P1       | À DÉVELOPPER (`include=pairs`)   |
| Filtre de mode sur `compare`                      | moyenne à élevée                         | absent (modes confondus, confirmé)                    | confirmée (champs présents)                           | nul                    | P1       | À DÉVELOPPER                     |
| Membres indisponibles nommés                      | moyenne                                  | absente (omission silencieuse)                        | confirmée                                             | nul                    | P1       | À DÉVELOPPER (`unavailable`)     |
| Variation par période précédente                  | moyenne                                  | absente                                               | hypothèse (profondeur d'historique)                   | faible                 | P2       | À DÉVELOPPER plus tard           |
| Marqueur de remise à zéro des rangs               | moyenne (courbe et progression faussées) | absent                                                | cause non confirmée                                   | à investiguer          | P2       | À QUALIFIER                      |
| Titres, tris, ex æquo, seuil 5 parties            | élevée                                   | disponible                                            | —                                                     | —                      | —        | DISPONIBLE, intégré              |
| Score composite de « meilleur joueur »            | faible, trompeur                         | —                                                     | —                                                     | —                      | —        | À ÉCARTER                        |
| Distribution de rôles                             | faible                                   | non fiable                                            | —                                                     | —                      | —        | À ÉCARTER                        |
| Ordre manuel, rôles, invitations, groupes publics | aucune justification                     | —                                                     | —                                                     | —                      | —        | À ÉCARTER                        |

Aucun P0 : le parcours principal fonctionne avec le contrat actuel. Handoff détaillé (DTO, exemples, nullables, tests, consommateurs) : `docs/back-groups-sprint3-requests.md`.

## Avant le Sprint 4

Rien de bloquant. (Mise à jour du 19/11 : les points « brancher P1-1 puis P1-2 » et « qualifier la remise à zéro des rangs » sont faits, voir Sprint 3.2.) Candidats : accessibilité de la courbe (données en tableau, clavier), brancher P1-1 puis P1-2 quand le back les livre, qualifier la remise à zéro des rangs avec le back, corriger la clé dupliquée de la navigation.
