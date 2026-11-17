# PROMPT CLAUDE CODE — FRONTEND THE BARONESS / PLAYER PROFILE V2

Tu es Principal Product Designer, Senior React/TypeScript Engineer et QA Engineer. Travaille **dans le repository FRONTEND existant** `luminescencedev/thebaroness` sur la branche `refonte-ui`. Lis tout le prompt avant de modifier un fichier.

## Objectif

Reconstruire **de zéro la composition INTERNE** de la page `/players/:steamId` en conservant l'architecture métier, les routes, hooks utiles, données, auth Steam, composants de design system et animations valables. Produire un profil Deadlock premium, dense mais lisible, fidèle au prototype validé (référence V2.1), avec header compétitif, **rang collé au pseudo**, rail analytique à gauche, performance récente et historique des matchs à droite, **lignes de match compactes**. Ne pas retoucher la landing V3, le shell, la sidebar, le branding ni les autres pages au-delà du strict besoin de partage de composants ou de compatibilité de contrat.

## Documents à lire AVANT le code

1. `docs/design/player-profile-v2/PRODUCT_SPEC.md` — spécification UI/UX complète (fichier fourni `01_PLAYER_PROFILE_V2_SPEC.md`).
2. `docs/back-player-profile-v2-contract.md` — demandes backend proposées (fichier fourni `02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md`).
3. `docs/HANDOFF.md` — à réconcilier et compléter avec le texte fourni `03_HANDOFF_APPEND_PROFILE_V2.md` ; ne pas écraser son historique.
4. `docs/design/player-profile-v2/prototype-v2.1.html` — référence UX interactive (fichier fourni `the-baroness-player-profile-v2.1.html`). Ce HTML est un prototype avec valeurs fictives : le rendu React doit utiliser les vrais tokens/composants de la DA et les vraies données, pas copier les mock values.
5. `docs/design/overhaul/`, `docs/design/refonte-v1/`, `src/styles/tokens.css`, `src/styles/globals.css`, `src/components/ui/DoubleBezel.tsx`, `src/app/AppShell.tsx`, `src/app/LandingLayout.tsx`.
6. `src/app/router.tsx`, `src/pages/PlayerPage.tsx`, `src/features/players/profile/*`, `src/features/players/hooks.ts`, `src/lib/stats.ts`, `src/api/types.ts`, `src/api/players.ts`, `src/api/catalog.ts`, `src/mocks/*`, `src/contracts/openapi.yaml`.
7. Backend **public** `https://github.com/LilStick/thebaroness-back`, particulièrement `docs/HANDOFF.md`, `docs/openapi.yaml`, `src/modules/players/{players.routes.ts,players.service.ts}`, `src/modules/meta/meta.service.ts` (lire le HEAD réel; référence inspectée `228064057f899d5949e5a6df89e41c34abc17165`).

## Très important — le backend est déjà en OpenAPI v1.8.0

Le frontend `refonte-ui` inspecté sur `84de6a49cf3ec2e607fc892a35145272520516cd` possède encore un OpenAPI antérieur. **Avant la refonte :** comparer les schémas puis synchroniser `src/contracts/openapi.yaml` avec le contrat *réellement livré* par le back (v1.8.0, ou version plus récente si elle existe au moment de ton exécution). Aligner les types, fixtures et tests existants.

- `MatchSummary.matchMode` et `.gameMode` **sont déjà livrés côté backend** ; ne pas les qualifier de nouveaux contrats.
- `MatchDetail` possède également ces deux champs.
- `LeaderboardEntry.inferred` et badge amélioré déjà livrés côté back ; ne pas casser le classement.
- Catalogue 44 héros avec Violet/Baba, noms de héros et rangs en anglais : déjà corrigé côté back selon son handoff.
- Ne pas déclarer livrés les nouveaux endpoints `overview`, `activity`, `rank-history`, ou les nouveaux filtres ; ce sont des **propositions à valider/implémenter**, pas des services actifs.

Ne change pas les anciennes routes sans raison. Documente la synchronisation dans `docs/HANDOFF.md`.

## Design validé (aucune nouvelle exploration DA)

- Application shell existant : fond graphite, sidebar intégrée au background, panneau central flottant arrondi, contraste doux, Geist, accents violet/cyan/vert/rouge sémantiques.
- `DoubleBezel` pour header, grands widgets de premier niveau, éventuellement panneaux importants ; **pas** un double bezel pour chaque sous-KPI ou rangée de match.
- Ne pas imposer de bandes de fond différentes, gros glows, décorations occultes gratuites, cartes imbriquées, UI SaaS générique.
- Garder des animations/gestures précises et `prefers-reduced-motion`.
- Toute l'UI du produit en français ; noms du jeu en anglais (heroes, ranks, abilities, items).

## Composition et contenu à implémenter

### A. Header profil enrichi

- Avatar Steam, nom, lien Steam, SteamID accessible dans menu secondaire ; nom long géré proprement.
- **Badge de rang officiel et `Acolyte VI`/`Oracle IV` accolés au pseudo** (à sa droite immédiate ou directement en dessous), jamais séparés dans un coin éloigné du header.
- Statut calibration/season/progression affiché **seulement si API fiable**. Si inconnu, masquer cette sous-information. Ne pas confondre unranked, inconnu et calibration.
- Top 3 heroes dans une zone droite discrète : portraits réels + tooltips matches/winrate; clic vers onglet Héros avec héro sélectionné.
- Follow/unfollow existant (connexion Steam si requise), partage du lien, actualisation existante avec cooldown 60 s ; gestion des erreurs. CTA principal clair, menu overflow pour actions secondaires.
- Ne pas mettre quatre énormes cartes KPI dans le header ; elles vont dans Performance récente.

### B. Tabs

Conserver les onglets fonctionnels `Aperçu`, `Parties`, `Héros` ; `Performance`, `Rang`, `Coéquipiers` ne seront pas montrés comme faux onglets si non implémentés. Conserver la navigation tab dans l'URL, l'accessibilité Base UI et le focus management.

### C. Aperçu en deux colonnes

Sur écrans où le **panneau de contenu** est assez large : gauche **310–340 px** de widgets analytiques, droite flexible (graphe et matchs). Ne pas changer en un layout match-first / widgets droite ; l'architecture validée est bien **widgets gauche, contenu majeur droite**.

**Rail gauche :**
1. Rang & Modes : rang actuel, W/L et winrate pour différentes combinaisons gameMode/matchMode ; taux + taille d'échantillon ; si backend n'a pas encore les agrégats filtrés, afficher la portée réellement connue et ne pas simuler les modes.
2. Activité récente : heatmap 12 semaines ; couleurs = activité, tooltip date/parties/W/L ; `isPartial` visible si jours non couverts.
3. Top Heroes : trois héros par volume de parties, vrai portrait, matches, WR, KDA ; lien vers l'onglet Héros.
4. Delta de période et Played With/Against **seulement quand** la donnée correspondante existe ; sinon les garder au backlog, pas comme faux chiffres.

**Colonne droite :**
1. Recent Performance : quatre KPI (`WR`, `KDA`, `Parties`, `Net worth/min`) et un graphique propre de ~180–220px. Par défaut `KDA par match`. Alternatives : rolling WR avec fenêtre de 10 parties **complètes**, net worth/min. Axes, labels, date, vraie fenêtre, taille échantillon, null breaks, tooltips et clavier. Points win/loss visuellement identifiables sans déformer les valeurs.
2. Recent Matches : **5 matchs récents** dans l'Overview ; bouton `Voir toutes les parties` vers l'onglet correspondant.
3. Un match = **ligne 64–72px desktop**, mobile cible 76–88px. Montrer outcome, hero, mode, date, durée, K/D/A, KDA, net worth ; **petite bande items et participants uniquement si vrais assets/données et place suffisante**. Sinon ces détails vont dans un expand sur demande.
4. Chevron explicite pour expand/collapse, lien distinct pour ouvrir `/matches/:matchId`; éviter le whole-row click ambigu.
5. Charger un détail enrichi à la demande depuis le match existant, sans N+1 pour les 5–200 lignes; préférer un cache par match ID.

### D. Onglet Parties

Réutiliser `MatchRow` responsive. Filtres date/période, gameMode, matchMode, hero, outcome, tri. Les filtres globaux affectent KPI/hero charts et les filtres locaux seulement la liste.

**Attention :** l'actuel `MatchesTab` filtre seulement les parties chargées côté navigateur; ne pas prétendre avoir filtré 100% de l'historique tant que le backend n'offre pas de filtres serveur. Prévoir une implémentation composable : query adapter pour nouveaux contrats, fallback honnête explicitement marqué (`X sur Y matchs chargés`). Pas de filtre fictif. Si nouveaux endpoints ne sont pas disponibles, P0 doit quand même fonctionner avec `dev:mock` et backend v1.8.0.

### E. Onglet Héros

Réorganiser en tableau/liste comparatif lisible avec portraits, matches, WR, KDA, possibilité de recherche/tri. Periode/modes uniquement si supportés côté serveur ; sinon indiquer clairement que les chiffres portent sur l'historique observé. Réutiliser `HeroPortrait` et les composants statistiques communs.

## Données, exactitude, limites

- `gameMode` vs `matchMode` sont des axes indépendants. `normal` correspond au format de jeu, `unranked` au matchmaking, `ranked` au matchmaking classé. Ne pas afficher 'normal/ranked/street brawl' comme trois valeurs de la même enum.
- Le back `StoredMatch` n'inclut actuellement que outcome codes 1 et 2; ne pas assimiler pénalisés/non scorés à pertes.
- `KDA per match` = `(K+A)/max(D,1)` si valeurs complètes. `KDA global` = `sum(K+A)/max(sum(D),1)` sur **les mêmes matchs avec triplet K/D/A complet**. Pas de moyenne de ratios présentée comme le KDA agrégé.
- Les données inconnues sont `null`, jamais 0. Ne jamais connecter artificiellement une courbe à travers des valeurs absentes.
- Période, mode, nombre de parties, `meta.isStale`, `meta.isPartial`, date de refresh doivent être interprétables.
- L'historique peut être incomplet : afficher 'sur les parties disponibles' et ne pas parler de lifetime records si source incomplète.
- Pas de notes de performance propriétaires A+, score 40.4, percentile joueur inventé ni MMR estimé.
- IDs Steam64 restent `string`. Champs inconnus (mode, rang) restent des états informatifs, non de faux zéros.

## Backend handoff : responsabilité de communication

Traiter `02_BACKEND_PLAYER_PROFILE_V2_CONTRACT.md` comme **proposition** :
- P0 nouveaux `/overview`, filtered `/matches`, filtered `/heroes` ; P1 `/activity`, rank-history, calibration fiable, enrich match detail, co-players.
- Ne PAS appeler ces endpoints en mode réel tant que LilStick n'a pas confirmé les avoir livrés.
- Documenter les besoins au sein de `docs/HANDOFF.md` (appendice fourni) avec statuts `proposé`/`accepté`/`livré`, et les tests associés.
- Préparer les mocks selon les contrats proposés, mais ne pas masquer en production l'absence d'API sous de faux chiffres.
- Les futurs items/builds via catalogue `/api/items` versionné et cache durable sont P2, **hors scope immédiat**, mais prévoir des interfaces réutilisables pour leurs mini-icons.

## Architecture React/TS

Proposition d'organisation, à adapter au code existant plutôt que recréer systématiquement :
- `src/features/players/profile/ProfileHeader.tsx`
- `src/features/players/profile/OverviewLayout.tsx`
- `src/features/players/profile/RecentPerformance.tsx`
- `src/features/players/profile/RankModesWidget.tsx`
- `src/features/players/profile/ActivityWidget.tsx`
- `src/features/players/profile/TopHeroesWidget.tsx`
- `src/features/players/profile/MatchHistoryPreview.tsx`
- `src/features/players/profile/MatchRow.tsx` (réutilisé onglet Partie)
- `src/features/players/profile/PlayerProfileFilters.tsx`
- pure utils/tests dans `src/lib/stats.ts` ou équivalent.

Priorité à la réutilisation des composants existants (`DoubleBezel`, `Card`, `Button`, `HeroPortrait`, `RankBadge`, `ChartFrame`, etc.). Réduire l'ancien `OverviewTab` monolithique tout en conservant les fonctionnalités pertinentes dans les bons onglets / backlog.

`useProfileData` ne doit plus imposer le chargement de 200 matchs pour afficher l'entête ou le premier résumé lorsque le nouveau endpoint Overview sera livré. En attendant, rendre le chargement progressif honnête, éviter les requêtes globales inutiles, conserver React Query et annulations/dédoublonnages.

## Responsive et validation

Tester au moins : 320, 390, 768, 1024, 1280, 1440, 1920, 2560px. Breakpoints en fonction de la **largeur intérieure du shell**, pas seulement du viewport. Mobile : header réorganisé, rang toujours proche du pseudo; KPI puis graphe puis parties avant widgets secondaires; chaque toucher utile >=44px; aucune scroll horizontale globale. Table dense sur desktop, disclosure sur mobile. Respecter contrastes, clavier, screenreader et prefers-reduced-motion.

Tests à faire :
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

Ajouter des tests ciblés sur KDA, mode, filtering/cursor fallback, URL tabs, header rank, expansions et états d'erreur/partiel. Si browser disponible, capturer l'écran réel à 390/768/1440 et 1920 px et vérifier. Ne pas prétendre avoir vérifié le rendu sans capture.

## Plan d'action obligatoire

1. **Inspecter état Git avant toute écriture** (`git status`, branch, fichiers modifiés). Préserver le travail en cours et ne pas reset.
2. Synchroniser OpenAPI v1.8+ et différences de types livrés, puis tester les flux existants.
3. Construire les primitives et adapter le fetch/mocks (sans dépendre de nouvelles routes non livrées).
4. Recomposer le header et les deux colonnes dans le shell actuel.
5. Implémenter performance récente et 5 match rows riches/compacts avec vraies données disponibles.
6. Refondre tabs Parties et Héros sans duplications.
7. Vérifier responsive, états de données et navigation; corriger les problèmes constatés.
8. Ajouter proprement les demandes P0/P1 au handoff et distinguer ce qui est livré/proposé.
9. Produire `docs/design/player-profile-v2/IMPLEMENTATION_REPORT.md` : fichiers modifiés, captures, tests, limitations backend, propositions à LilStick, interactions réellement testées, étapes restantes.

**Ne change pas de branche, ne commit pas et ne push rien sans ma demande explicite.** Ne touche pas au dépôt backend depuis cette session. Si manque de données, une V2 partielle mais fonctionnelle et honnête vaut mieux qu'un faux rendu rempli de mock data en mode réel.

**Critère final :** dès l'arrivée sur `/players/:steamId`, le joueur se reconnaît immédiatement (pseudo + rang groupés), comprend ses performances, voit ses 5 dernières parties sur une interface compacte et peut approfondir sans effort. La page doit être aussi agréable à screenshot qu'utile au quotidien.
