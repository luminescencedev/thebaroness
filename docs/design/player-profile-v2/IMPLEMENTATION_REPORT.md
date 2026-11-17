# Rapport d'implémentation : Profil joueur V2

Date : 17/11/2026. Branche `refonte-ui`. **Rien n'est commité à cette étape** (seul le commit documentaire `5ec268f` a été poussé). Landing et shell non modifiés.

## Synchronisation des contrats

- `src/contracts/openapi.yaml` : v1.8.0 (back `2280640`), ancienne copie v1.6.0.
- Types : `MatchMode`, `GameMode`, `MatchSummary.matchMode` et `gameMode`, `MatchDetail.matchMode` et `gameMode`, `LeaderboardEntry.inferred` (`src/api/types.ts`). `matchMode` (type de partie) et `gameMode` (format) restent deux axes distincts (`src/lib/modes.ts`).
- Mocks : parties synthétiques avec modes (≈ 15 % classées, ≈ 5 % Street Brawl), `inferred` sur le classement synthétique, détail de partie inchangé.
- Aucune route proposée (`overview`, `activity`, `rank-history`, filtres serveur) n'est appelée, même en mock.

## Fait

- **En-tête** (`ProfileHeader.tsx`) : avatar avec lien Steam, **pseudo et rang dans le même conteneur** (« Oracle IV », chiffres romains), SteamID copiable, région, fraîcheur et alerte `isStale`, trois héros avec taux de victoire (lien vers l'onglet Héros avec le héros sélectionné), Suivre, Actualiser (pause de 60 s), menu des autres actions (partager, copier le SteamID, voir sur Steam). Sur mobile, Suivre est dans la barre fixe du bas.
- **Aperçu** (`OverviewLayout.tsx`) : rail gauche de 320 px (selon la largeur du panneau, container query), contenu à droite. Mobile : performance et parties d'abord.
  - Rang et modes : rang actuel, bilan classée, normale, Street Brawl avec effectifs, parties sans mode signalées.
  - Activité : calendrier sur 12 semaines, avertissement d'historique partiel.
  - Héros les plus joués : trois héros, taux, KDA, repère méta.
  - Performance récente : fenêtre 10, 20 ou 50 parties, quatre KPI, graphique KDA par partie, victoires glissantes (10 parties) ou valeur nette par minute. Une valeur absente interrompt la courbe. Lecture alternative « Voir les données ».
  - Dernières parties : 5 lignes.
- **Ligne de partie** (`MatchRow.tsx`) : 68 px sur desktop (mesuré sur capture), 76 à 88 px sur mobile. Résultat en toutes lettres, héros, pastille de mode, date, durée, K/D/A, KDA, valeur nette et par minute. Chevron explicite (`aria-expanded`), détail à la demande avec les participants des deux équipes (`GET /matches/:id`, une requête par ligne ouverte, mise en cache), lien distinct « Ouvrir la partie ». Pas de bande d'objets : la donnée n'existe pas.
- **Onglet Parties** : filtres résultat, période, mode, héros, tri, réinitialisation.
- **Onglet Héros** : liste comparative (recherche, tri, écart face à la méta, avertissement « peu de parties »), héros sélectionné par `?hero=`.
- Onglet dans l'URL conservé (`?tab=`), accessibilité Base UI, focus.
- `AreaChart` : les valeurs absentes coupent la courbe (corrigé, avant elle les reliait).
- Statistiques : `modeBreakdown` et tests unitaires (12 tests dans `src/lib`).

## Vérifications

| Contrôle               | Résultat                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | OK                                                                                                  |
| `npm run lint`         | OK                                                                                                  |
| `npm test`             | 47 tests passent (profil : rang collé au pseudo, onglet dans l'URL, filtre, dépliage de ligne)      |
| `npm run build`        | OK (avertissement de taille de chunk existant)                                                      |
| `npm run test:e2e`     | 16 passés, 2 ignorés                                                                                |
| Débordement horizontal | aucun à 320, 390, 768, 1024, 1280, 1440, 1920 et 2560 px, sur les trois onglets (mesuré par script) |
| Captures               | `screenshots/profile-v2-*.png` : 1440 px (aperçu, parties, héros), 390 px (aperçu, parties)         |

Non fait : captures à 768, 1024, 1920 et 2560 px (seule la mesure de débordement l'a couverte) ; contrastes non mesurés par outil ; essai en mode réel (back Docker) non refait pour ce profil.

## Limites

1. **Tout est calculé sur les parties chargées** (jusqu'à 200, pages de 50). Les filtres de l'onglet Parties ne portent pas sur tout l'historique tant que le back ne filtre pas côté serveur. L'écran le dit.
2. Aucun mock de contrat proposé n'a été ajouté (`/overview`, `/activity`, `/rank-history`, filtres) : le profil n'en a pas besoin, et ils auraient ressemblé à des API livrées. Ils seront ajoutés quand le contrat sera validé avec le back.
3. Pas de progression de rang, de calibration, de placement, de « joué avec » ni d'objets : aucune donnée fiable.
4. Le classement n'utilise pas encore `inferred` à l'écran (type et mock seulement) ; il lit toujours le rang des 10 premiers sur leur profil.
5. Les anciennes analyses de l'aperçu (rôles, heures, distribution du KDA, victoires par durée, forme sur 10 parties) ne sont plus affichées : elles sont au backlog (candidates pour un onglet Performance quand le back fournira des filtres).

## Demandes au back (voir `docs/HANDOFF.md`)

P0 : `overview`, filtres serveur sur `matches` (`period`, `gameMode`, `matchMode`, `heroId`, `outcome`), `heroes` avec `period` et modes. P1 : `activity`, `rank-history`, détail de partie enrichi. Aucune n'est livrée.

## Fichiers

Créés : `src/features/players/profile/{ProfileHeader,OverviewLayout,RankModesWidget,ActivityWidget,TopHeroesWidget,RecentPerformance,MatchHistoryPreview,MatchRow}.tsx`, `src/lib/{modes,rank}.ts`. Réécrits : `MatchesTab.tsx`, `HeroesTab.tsx`, `src/pages/PlayerPage.tsx`. Supprimés : `OverviewTab.tsx`, `ProfileBanner.tsx`. Modifiés : `src/api/types.ts`, `src/lib/stats.ts` (+ tests), `src/components/charts/AreaChart.tsx`, `src/mocks/synthetic.ts`, `src/app/flows.test.tsx`, `src/contracts/openapi.yaml`, `docs/HANDOFF.md`.

## Passe V2.2 (retour UX/UI du 17/11/2026)

Captures conservées : `screenshots/v22-*.png`, `nav-*.png` (fil d'Ariane contextuel), `v19-*.png` et `real-*.png` (voir `INTEGRATION_V1_9_REPORT.md`). Les captures intermédiaires (autres largeurs, états de scroll) ont été supprimées pour alléger le dépôt ; 320 et 2560 px ont été vérifiés par script sans débordement horizontal, non regardés à l'oeil.

**Lignes de partie** (`MatchRow`, `MatchBuild`, `MatchTeams`, `useMatchEnrichment`, `lib/matchModel.ts`). Un seul composant pour Aperçu (5 lignes) et Parties. Les colonnes dépendent de la largeur de la ligne (container queries) : < 600 mobile (résultat, héros, KDA) ; 600 tablette (+ date relative, durée, valeur nette, CS, KP, HS) ; 760 + build (2 x 6 icônes) ; 880 + équipes en portraits ; 1000 + équipes avec pseudos. Hauteurs mesurées : 76 px mobile, 68 px de 600 à 880, 90 px au palier le plus large. Le chevron déplie (animation grid-rows, inerte quand replié, sans transition en `prefers-reduced-motion`) : stats secondaires, distinctions, build nommé, tableau des deux équipes avec liens vers les profils identifiables, identifiant copiable, lien « Ouvrir la partie » séparé.

**Données.** Réel (OpenAPI 1.8.0) : derniers coups, KP, position par valeur nette, KDA, participants. Proposé au back, optionnel et lu s'il existe : `MatchPlayer.items`, `MatchPlayer.headshotPct`. Mock uniquement : builds et HS synthétiques (catalogue de 20 noms de jeu, identifiants fictifs 9 000 000+, tuile de repli sans fausse icône), signalés « exemple synthétique du mode démo » (`IS_MOCK`). En production sans ces champs : « n/d ». Requêtes : une par ligne, déclenchée par proximité de l'écran (IntersectionObserver, >= 768 px) ou dépliage, cache 10 min.

**Header.** Rang : badge officiel et texte neutre clair collés au pseudo, plus de pilule ni de couleur de rang sur le texte. **Onglets** : contrôle segmenté Base UI (surface sélectionnée animée, plus de barre pleine largeur ni de sticky). **Shell** : le fil d'Ariane est une petite pastille flottante sans bandeau ni bordure (gain d'environ 36 px en haut, tous écrans de l'application) ; fondu en haut et en bas du panneau par masque CSS, activé seulement quand du contenu dépasse (attributs `data-scrolled` / `data-more` posés par `AppShell`), désactivé en bas sur mobile pour la barre d'action fixe. Pas de `backdrop-filter` : le masque est moins coûteux et ne gêne pas les portails.

**Tests.** 53 unitaires (dont `matchModel.test.ts`, dépliage avec build et équipes, onglets), 16 e2e passés (2 ignorés), typecheck, lint, build OK.

**Limites.** Le fondu n'a été vérifié visuellement que sur des captures statiques (haut et bas), pas en défilement continu ; pas de test automatisé du fondu ni de la position du fil d'Ariane (jsdom ne calcule pas la mise en page). Le texte de rang du widget « Rang et modes » reste coloré. Les distinctions se limitent à deux critères calculables (1er en valeur nette, meilleur KDA) : aucune note inventée. Filtres toujours locaux aux parties chargées. Pas d'essai en mode réel contre le back Docker.
