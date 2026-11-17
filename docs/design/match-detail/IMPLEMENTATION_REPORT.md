# Match Detail V3 : rapport d'implémentation

Date : 17/11/2026. Travail sur `main`, aucun commit ni push. Références au départ : front `55b9ae1`, back `ebaabd2`, OpenAPI 1.11.0 (vérifié inchangé).

## 1. État de départ

`MatchPage.tsx` (326 lignes) : grand header de victoire, comparaison, deux tableaux empilés, noms d'équipes obsolètes (Amber Hand, Sapphire Flame), MVP déduit du meilleur KDA. Le prototype a été lu en entier (`prototype-v3.html`, copié dans ce dossier) : composition et interactions reprises, thème CSS et données fictives non importés.

## 2. Livré

- Header de résultat compact : équipes, résultat réel, score identifié « Total des éliminations », durée, date, format, rang moyen, identifiant avec bouton Copier (retour « Identifiant copié »).
- Scoreboard : deux équipes côte à côte (container query, 780 px), colonnes secondaires qui se retirent (dégâts 500 px, build 660 px, valeur nette sous le K/D/A en mobile), tri commun valeur nette, dégâts, KDA (inconnus en dernier, tri stable), sélection par bouton, lien profil séparé du bouton, MVP officiel (`mvpRank === 1`).
- Détail du joueur : sélection initiale MVP, sinon plus forte valeur nette, sinon premier joueur. Onglets Statistiques (barres relatives à la meilleure valeur connue, jauges précision et participation, relevé dense) et Build & achats (objets finaux, chronologie, ventes barrées, heure inconnue en n/d, repli sans catalogue).
- Comparaison des équipes : éliminations, valeur nette, dégâts aux héros, soins. Une somme n'est affichée que si les 6 joueurs ont la valeur, sinon `n/d (k/6)` et aucune barre.
- Sidebar masquable (voir révision) ; initialement « Pleine largeur » limitée à la page partie : le panneau recouvre la sidebar par `margin-left` négatif animé (320 ms, `--ease-out`, coupé en `prefers-reduced-motion`). La sidebar garde sa colonne, devient `inert` et s'estompe (sans cela, l'arrondi du panneau laissait voir le bouton Steam). État porté par `AppShell`, bouton dans la `Topbar` à droite du fil d'Ariane, `aria-pressed`, libellé selon l'état, rétabli dès qu'on quitte la route.

### Révision du 17/11/2026 (retours utilisateur)

- Retour : bouton chevron dans la topbar de toutes les pages à fil d'Ariane (historique précédent, sinon parent, sinon accueil). Avant, la page partie n'offrait aucune sortie.
- Sidebar : le bouton « Pleine largeur » propre à la page est remplacé par un bouton icône global (bureau, toutes les pages) : icône dans l'en-tête de la sidebar pour la masquer, icône dans la topbar du panneau pour la rouvrir. Préférence mémorisée (`localStorage`, avec repli si indisponible). Le panneau recouvre toujours la sidebar sans la déplacer ; elle reste inerte et estompée.
- Souls en métrique principale : le header affiche les souls d'équipe en grand (éliminations en secondaire), le tri par défaut et la comparaison commencent par les souls.
- Lisibilité façon dpm.lol : puces de position par souls (n°1 à n°12) et MVP, K/D/A avec morts en rouge et KDA dessous, souls et dégâts avec barres, KP, en-tête d'équipe avec Victoire/Défaite en couleur et totaux (souls, éliminations, dégâts). Colonnes par container query : souls dès 400 px, dégâts 520, build 600, KP 780.

## 3. Fichiers

Créés : `src/features/matches/detail/` (`model.ts`, `MatchDetailView`, `MatchSummaryHeader`, `MatchScoreboard`, `MatchPlayerDetail`, `MatchTeamComparison`, `model.test.ts`, `matchPage.test.tsx`), `src/lib/teams.ts`, ce dossier (prototype, rapport, captures).
Modifiés : `MatchPage.tsx` (réduit à l'état de chargement/erreur), `AppShell.tsx`, `Topbar.tsx`, `globals.css` (bloc pleine largeur), `RadialGauge.tsx` (`mark={null}`), `MatchTeams.tsx` (labels), `matchModel.ts` et `types.ts` (`atSeconds` nullable), `mocks/synthetic.ts` (rang MVP unique de 1 à 12), `flows.test.tsx`, `docs/decisions.md`, `docs/HANDOFF.md`.

## 4. Décisions et écarts avec le prototype

- Victoire/défaite lues uniquement dans `winningSide`; `null` donne « Résultat inconnu » pour les deux équipes, jamais deux défaites.
- Un seul `DoubleBezel` par bloc de premier niveau (header, scoreboard, détail, comparaison), aucun imbriqué. Couleurs d'équipe en accents (point, nom, barres), surfaces graphite.
- Retirés ou remplacés : « Net worth » en anglais, coût en souls des achats (le catalogue donne le prix actuel, pas le prix payé), « Contribution » inventée, `Prototype UX` et bandeaux de démo, grands titres.
- Bouton Copier placé dans le header de la page (le prototype le mettait dans la topbar) pour garder la topbar réservée à la navigation et à la pleine largeur.
- `abilityUpgrades` non affiché : le catalogue chargé ne contient que le type `upgrade`, les noms de capacités ne sont donc pas résolus.

## 5. Données : disponible ou non

| Besoin V3                                                      | Source                                 | État              | Traitement                                      |
| -------------------------------------------------------------- | -------------------------------------- | ----------------- | ----------------------------------------------- |
| Équipes, résultat, durée, date, format                         | `GET /matches/{id}`                    | oui               | direct                                          |
| Rang moyen d'équipe                                            | `teams[].averageRankName`              | oui, souvent null | `n/d`                                           |
| K/D/A, valeur nette, niveau                                    | joueur                                 | oui               | direct                                          |
| Dégâts, objectifs, soins, creeps, précision, critiques         | `stats`                                | oui               | `n/d` si null                                   |
| Participation                                                  | `killParticipation`                    | oui               | sinon calcul si éliminations d'équipe complètes |
| MVP officiel                                                   | `mvpRank`                              | oui               | badge si 1                                      |
| Objets, achats, ventes                                         | `finalItemIds`, `purchases` + `/items` | oui               | catalogue mutualisé (1 h)                       |
| Rang individuel par joueur                                     | aucune                                 | non               | supprimé, non déduit du rang moyen              |
| Valeur nette minute par minute, momentum, contrôle d'objectifs | aucune                                 | non               | supprimés                                       |
| Région, patch                                                  | aucune                                 | non               | supprimés                                       |

Aucune évolution back requise pour livrer. Demandes futures possibles (hors chantier) : rang individuel par joueur, série économique par minute.

## 6. Vérifications

- `npm run typecheck` : OK. `npm run lint` : OK. `npm run build` : OK.
- `npm run test` : 12 fichiers, 109 tests passés (13 nouveaux : modèle, page, pleine largeur).
- `npm run test:e2e` : 15 passés, 2 ignorés, 1 échec sur `journey.spec.ts` dans le run complet (instabilité déjà connue sous charge) ; relancé seul : 4 passés.
- Pas de débordement horizontal du document à 320, 390, 768, 1024, 1280, 1440, 1920, 2560 px (script).
- Test contre le vrai back 1.11.0 (Docker, partie 136927164) : vérifié visuellement à 1440 px en pleine largeur, onglet Build : vraies icônes, ventes barrées, totaux d'équipes. Cette partie n'a ni heure d'achat nulle ni `winningSide` nul : ces cas sont couverts par tests et par une capture avec réponse modifiée.

## 7. Captures (`screenshots/`)

`m-{320,390,768,1024,1280,1440,1920,2560}.png`, `m-1440-fullwidth.png`, `m-1440-build.png`, `m-390-scrolled.png`, `m-1440-missing.png`, `m-1440-missing-build.png`, `m-390-missing.png`, `real-1440.png`, `real-1440-fullwidth-build.png`.

## 8. Limites

- Les captures ont été regardées à 320, 390, 768, 1280 et 1440 px ; 1024, 1920 et 2560 px seulement par script de débordement.
- Les cas « données manquantes » viennent d'une réponse modifiée dans le navigateur, pas d'un vrai back.
- Navigation clavier de la liste testée par tests (focus, `aria-pressed`) mais pas parcourue à la main ; tooltips d'objets non revérifiés à la main sur tactile.
- La transition de pleine largeur anime une marge : le contenu se recompose pendant 320 ms ; à mesurer si des saccades apparaissent sur machine modeste.
- `mvpRank` supposé dans 1 à 12 ; le tri par KDA utilise (K + A) / max(D, 1), pas une valeur du back.

## 9. Suite proposée

Valider la composition, puis envisager les pages Items et Builds (routes back prêtes) et confirmer avec le back que `heroCritRate` correspond bien aux tirs à la tête.
