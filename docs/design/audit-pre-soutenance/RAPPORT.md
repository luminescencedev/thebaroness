# Audit global pré-soutenance (19/11/2026)

Rapport unique. Rien n'a été commité, poussé ni déployé. Les chiffres ci-dessous viennent de commandes réellement exécutées pendant l'audit ; ce qui n'a pas été testé est dit explicitement.

## A. État Git

| Dépôt                             | HEAD                | Branche | Synchro                   | Modifications locales                                                       |
| --------------------------------- | ------------------- | ------- | ------------------------- | --------------------------------------------------------------------------- |
| Front                             | `cbc22c6`           | `main`  | identique à `origin/main` | 2 fichiers de code (correctif fil d'Ariane), 1 test, ce dossier de docs     |
| Back (`../deadlock-tracker-back`) | `f319777` (v1.15.0) | `main`  | identique à `origin/main` | aucune (dépôt lu seulement, tests exécutés sur une copie propre hors dépôt) |

OpenAPI : `src/contracts/openapi.yaml` du front est identique au `docs/openapi.yaml` du back (v1.15.0, `diff` vide). `npm run openapi:check` du back : « OpenAPI 1.15.0 valide et synchronisé ».

## B. Tests exécutés

| Commande                          | Résultat                                                                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Front `npm run typecheck`         | exit 0                                                                                                                                                      |
| Front `npm run lint`              | exit 0                                                                                                                                                      |
| Front `npm run test`              | 32 fichiers, **267 tests passent**, 0 échec                                                                                                                 |
| Front `npm run build`             | exit 0 ; avertissement : bundle principal 589 kB (185 kB gzip)                                                                                              |
| Front `npm run test:e2e`          | **31 passent, 5 ignorés** (parcours desktop pour mobile), 0 échec                                                                                           |
| Front Prettier (`src`, `e2e`)     | conforme                                                                                                                                                    |
| Front `npm audit --omit=dev`      | 0 vulnérabilité                                                                                                                                             |
| Back `typecheck`, `lint`, `build` | exit 0 chacun                                                                                                                                               |
| Back `openapi:check`              | valide et synchronisé (1.15.0)                                                                                                                              |
| Back `npm test` (jest)            | 30 suites, **501 passent, 1 échec instable** (voir D, P2 back)                                                                                              |
| Back `npm audit --omit=dev`       | 0 vulnérabilité                                                                                                                                             |
| Contrat réel                      | 28 réponses réelles du back local validées contre le schéma OpenAPI du front : **28 conformes** (contrôle négatif fait : un corps invalide est bien rejeté) |

Limites : les tests du back tournent avec Mongo en mémoire et sans réseau (par conception) ; l'échec unique est un test non déterministe, pas une régression.

## C. Audit fonctionnel

Sources : **MSW** = tests Vitest et E2E sur données synthétiques ; **Local** = front (Vite) + back v1.15.0 local (MongoDB locale) + Deadlock API réelle ; **Prod** = requêtes non destructives sur la production.

| Fonctionnalité                                                 | Testée                     | Résultat                                                                    | Source                 | Risque                                        |
| -------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------- | ---------------------- | --------------------------------------------- |
| Landing, méta groupée                                          | oui                        | 5 widgets, valeurs réelles, aucune erreur                                   | Local, MSW             | faible                                        |
| Recherche (pseudo, homonymes, SteamID)                         | oui                        | exacte, homonymes signalés, 20 résultats                                    | Local, MSW             | faible                                        |
| Classement Europe                                              | oui (1 région, à froid)    | 100 entrées, rangs, « déduit », héros ; 1er lu = 1er de l'API               | Local, MSW             | chargement à froid ~10 s                      |
| Profil (aperçu, héros, parties)                                | oui                        | KPI = API (55,71 %, 39 V / 31 D, KDA 3,57, 1 244 net/min)                   | Local, MSW             | faible                                        |
| Match                                                          | oui                        | totaux d'équipe, KDA, MVP = API                                             | Local, MSW             | faible                                        |
| Héros, fiche, builds, paires                                   | oui                        | méta = API (32,38 %, 52 %, 2 165 573 parties)                               | Local, MSW             | faible                                        |
| Items, fiche                                                   | oui                        | 173 objets, prix exacts (800, 1 600, 3 200, 6 400, 9 999), stats = API      | Local, MSW             | stats 30 jours instables côté source (voir G) |
| Connexion Steam (OpenID réel)                                  | **non**                    | impossible hors domaine public ; session obtenue par jeton signé localement | Local                  | **moyen** : voir I                            |
| Mes suivis (créer, alias, note, tag, filtre, fiche, supprimer) | oui, de bout en bout       | tout passe, rang et forme réels (« Eternus 5 », 3/10)                       | Local                  | faible                                        |
| Groupes (créer, comparer, période, mode, modifier, supprimer)  | oui, de bout en bout       | tout passe, URL conservée, courbe coupée à la frontière de saison           | Local, MSW             | faible                                        |
| Parties jouées ensemble, saisons, période précédente           | oui                        | conformes au contrat ; couverture et « non évalué » affichés                | Local, MSW             | faible                                        |
| Session invalide, routes protégées, 404                        | oui                        | pas de plantage ; 401 sur toute route privée sans jeton                     | Local, Prod, MSW       | faible                                        |
| Résilience (503, 429, 502, réseau coupé)                       | oui, 9 pages x 4 scénarios | aucune page blanche, aucune erreur JS, état d'erreur et « Réessayer »       | simulée (interception) | faible                                        |
| Résilience (JSON cassé, `{}`)                                  | oui                        | pas de page blanche, mais page d'erreur globale sans le menu (voir D)       | simulée                | faible (contrat violé)                        |
| Production                                                     | oui, non destructif        | **en retard sur le code** (voir E)                                          | Prod                   | **élevé**                                     |

## D. Bugs

**P0 : aucun.**

**P1**

- **Production déployée en retard.** Front de production sans les pages Items (aucun chunk `ItemsPage`, `ItemPage`), fichier du 18/11 09:55 ; back de production à v1.13 (`/heroes/stats` répond 400, `rank-history` sans `seasons`). Cause : les derniers pushs n'ont pas (encore) été déployés. Impact : la démonstration sur le site public ne montrerait pas Items, la méta groupée ni les nouveautés des groupes. Action : décision de déploiement (voir I). Non corrigé (déploiement interdit sans accord).
- **Image Docker locale périmée.** `thebaroness-back:local` date du 17/11 : même retard que la production (`/heroes/stats` absent, pas de saisons). Action : `docker compose up --build -d` dans le dépôt du back avant de s'en servir pour la démonstration.

**P2 (corrigé)**

- Fil d'Ariane « Mes suivis > Mes suivis » (et clé React dupliquée dans la console) sur la fiche d'un suivi, quand le titre publié était encore celui de la liste. Reproduit en navigant liste vers fiche. Cause : `crumbsFor` reprenait le titre de la page précédente. Correctif : on ne répète jamais le parent (libellé « Détail » jusqu'au titre), clé de liste dépendant de la position. Test : `navModel.test.ts` (3 cas). Statut : corrigé, vérifié (l'avertissement n'apparaît plus).

**P2 (documenté, non corrigé volontairement)**

- Console : 404 transitoire après la suppression d'un suivi ou d'un groupe (la page encore montée relit la ressource supprimée). Invisible pour l'utilisateur. Un correctif tenté a été annulé (sans effet, risque inutile avant l'oral).
- Back : test `sprint3 › membres indisponibles › raisons distinctes` instable (échoue 1 fois sur 3 en isolé) : si un quota est atteint en cours de lecture, un membre « introuvable » peut être classé `rate_limited` selon l'ordre de traitement. Comportement défendable en production, mais test non déterministe.
- Back : `GET /matches/:id` avec un identifiant inexistant renvoie 503 (« temporairement indisponibles ») au lieu de 404.
- Page partie sans titre `h1` (accessibilité).
- 320 px : lignes « Dernières parties » du profil serrées (noms de héros réduits à une lettre). Desktop et 390 px propres.
- Réponse API qui viole le contrat (`{}` ou JSON cassé) : page d'erreur globale sans le menu. Ne se produit pas avec un back conforme (28 réponses validées).
- Bundle principal de 589 kB (185 kB gzip), au-dessus du seuil d'avertissement de Vite.
- Environnement de test : les avatars `avatars.steamstatic.com` sont refusés (certificat) dans ce bac à sable ; ce n'est pas un défaut de l'application.

## E. API et déploiement

- Version locale testée : v1.15.0. Routes exercées en réel : héros, méta groupée, rangs, carte, recherche, profil, parties (avec `include=summary`), overview, héros du joueur, tendances, activité, historique de rang, relations, match, classement, objets, builds, paires, insights, groupes (`include=members`), comparaison (`include=pairs`, saison, modes), suivis, auth.
- Contrat : valeurs nulles et énumérations conformes (28 sur 28) ; `rankDelta` lu comme « dernière saison » partout (`rankDeltaScope`), courbes de groupes et de profil coupées à chaque changement de `season`, vérifié sur données réelles (frontière du 05/11 20:00 UTC).
- Erreurs : 400 `INVALID_INPUT`, 401 `UNAUTHORIZED`, 404 `NOT_FOUND`, 503 `SERVICE_UNAVAILABLE` au format `{ error: { code, message } }`.
- Production (non destructif) : front et API répondent en HTTPS (200), santé OK, routes profondes de la SPA OK (200), CORS limité à l'origine du front, routes privées en 401. Mesure ponctuelle : classement Europe à froid 26 s (une requête).

## F. Sécurité (back local, deux comptes de test)

- Isolation : un compte B obtient 404 sur le suivi et le groupe de A (lecture, modification, suppression, comparaison, actualisation) et des listes vides.
- Jetons refusés (401) : algorithme `none`, mauvaise clé, expiré, mauvais type, `sub` invalide.
- Entrées : objet NoSQL dans `steamId`, alias de 5 000 caractères, champ interdit `ownerId`, 100 tags, nom de groupe vide, 1 ou 21 membres, doublons : tous rejetés en 400. Injections de chemin et de requête : 400.
- Nom de groupe contenant du HTML : stocké tel quel (accepté), affiché comme texte par React (pas d'exécution).
- En-têtes de production : HSTS, CSP stricte, `nosniff`, `X-Frame-Options`, `Referrer-Policy`. CORS : l'origine du front est autorisée, une origine étrangère ne reçoit pas `Access-Control-Allow-Origin`.
- Dépendances de production : 0 vulnérabilité (front et back). Aucun secret affiché ni écrit.
- Non testé : limitation de débit sous charge (interdit contre la production), Steam OpenID réel.

## G. Performance

- Requêtes par parcours (Chromium, mode développement qui double certaines requêtes) : landing 12-13, profil 28, onglet Héros 19, héros 14, items 13, classement 12 ; aucun N+1 (méta de l'accueil en 1 requête, suivis en 1 requête).
- Durées observées en local : classement à froid ~10-14 s (rangs résolus par le back, mis en cache ensuite), profil ~9 s à froid, autres pages 4-8 s avec la source réelle.
- Source Deadlock : à 30 jours, `items/stats` peut répondre 503 (source 504) ; l'interface reste utilisable (« Voir sur 7 jours »). À privilégier : `?period=7d` pour la démonstration des items.

## H. Vérification visuelle

19 pages ou états sur 5 largeurs (1440, 1024, 768, 390, 320 px) avec le back réel : **aucun débordement horizontal**, aucune erreur JavaScript, aucune requête échouée inattendue (seules erreurs : avatars Steam du bac à sable, et les 404 attendus des pages d'identifiant inconnu). Captures retenues dans `captures/` (1440 des pages principales, 390 et 320 de quatre pages, suivis, groupe, résilience). Pages inspectées à l'œil : match, recherche, classement, profil à 320 px, erreurs réseau et 503. Les autres largeurs sont validées par la mesure de débordement, pas toutes revues à l'œil.

## I. État de la démonstration

**Choix recommandé** (à décider avant l'oral) : redéployer d'abord le back (v1.15.0), puis le front, puis vérifier la connexion Steam sur le domaine public. C'est la seule voie pour montrer Mes suivis et Groupes avec de vraies données et une vraie connexion. Je n'ai rien déployé.

**Scénario A : données réelles en local** (sans connexion)

1. Back : dans le dépôt du back, `docker compose up --build -d` (reconstruire l'image, qui date du 17/11), attendre `GET /api/health` = ok. Front : `npm run dev` (proxy vers le port 3001).
2. Préchauffer avant l'oral (caches de 5 à 30 min) : ouvrir une fois le classement Europe, le profil de LilStick et la page du match.
3. Parcours : `/` → recherche « LilStick » → `/players/76561198249791904` (changer de période, onglet Héros, Parties) → `/matches/139836852` → `/heroes/6` (onglets Builds et Statistiques) → `/items/7409189?period=7d` → `/leaderboard` (Europe) → `/players/76561198346079732` (MikaelS, n°1).
4. Identifiants publics vérifiés : LilStick `76561198249791904`, MikaelS `76561198346079732`, match `139836852`, héros Abrams `6`, objet Improved Spirit `7409189`.

**Scénario B : repli contrôlé** (hors ligne ou source en panne, avec connexion et groupes)

- `npm run dev:mock`. Données **synthétiques**, à annoncer comme telles. « Connexion Steam » ouvre un compte simulé (Corvid) ; Mes suivis, Groupes (comparaison, parties communes, saisons) et le reste fonctionnent. Joueur de démonstration : Corvid `76561198000000000`. Les 31 tests E2E tournent sur ce mode.

**Prérequis de connexion** : la connexion Steam réelle n'a pas pu être testée localement (OpenID exige l'URL publique). Elle ne se vérifie que sur le domaine déployé.

**Risques réseau** : classement à froid (jusqu'à 26 s mesuré en production), quotas de la source (429, 503 gérés par l'interface), objets sur 30 jours.

## J. Verdict

**GO AVEC RÉSERVES.**

- Aucun P0 connu ; contrat 28 sur 28 conforme ; tests front (267 unitaires, 31 E2E) et back (501 sur 502) exécutés ; parcours de bout en bout (suivis, groupes) validés avec le back réel ; valeurs affichées égales aux valeurs de l'API sur 8 contrôles ; isolation et jetons vérifiés.
- Réserves : (1) la production et l'image Docker locale sont en retard sur le code, donc le site public ne reflète pas le travail récent tant qu'un déploiement n'est pas décidé ; (2) la connexion Steam réelle n'a pas été testée ; (3) un test back instable.
- Si la démonstration se fait en local (scénario A) ou en mock (scénario B), je ne connais aucun défaut bloquant.

## Travaux à reprendre après l'oral

1. Déployer back puis front ; vérifier Steam OpenID et les groupes en production.
2. Back : 404 pour un match inconnu ; rendre le test des raisons d'indisponibilité déterministe.
3. Front : 404 transitoire après suppression ; titre `h1` de la page partie ; lignes d'historique à 320 px ; garde de forme sur les réponses (page d'erreur plus locale) ; découpage du bundle.
4. Sprint 4 (Mes suivis) comme prévu.
