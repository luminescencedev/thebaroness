# Audit de l'interface (Phase 0)

Date : 16/11/2026. Base : commit `2522757`. Lecture du code, captures du shell avant/après.

## Inventaire

- **14 pages** (`src/pages`) : Home, Search, Player, Heroes, Hero, Leaderboard, Match, Tracked, TrackedDetail, Groups, GroupDetail, Login, AuthCallback, NotFound (+ `RouteError`).
- **UI** (`src/components/ui`, 18 fichiers) : Alert, Avatar, Button, Card, Dialog, EmptyState, Field, Input, Kbd, Label, Segmented, Skeleton, Spinner, Tag, Textarea. **Absents** par rapport à la mission : IconButton, SearchInput, Select, Tabs (Base UI utilisé en direct dans PlayerPage), Badge, Dropdown, Popover, Drawer, Tooltip, DataTable, Pagination, StatMetric, StatGroup, SectionHeader (existe hors `ui/` : `components/PageHeader.tsx`).
- **Graphiques** (`src/components/charts`, 19 fichiers) : Area, BarList, BulletBar, CalendarHeatmap, ChartFrame, DeltaChip, Donut, FormStrip, Histogram, HourBars, Line, MultiLine, Radar, RadialGauge, RankProgress, Sparkline, StackedKDA, `smooth.ts`.
- **Tests** : 45 tests Vitest, 18 tests Playwright (desktop + mobile).
- **Dépendances de mouvement** : pas de Motion dans `package.json`. Le mouvement repose sur du CSS (`pressable`, `reveal`, `rise`, `chart-reveal`, marque animée), Vaul (drawer) et Base UI (dialogue, menu, tabs).

## Problèmes constatés, avec fichiers responsables

| #   | Problème                                                                                                                                                      | Cause                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | Largeur bloquée à 1152 px (`max-w-6xl`), 768 px pour le classement et les groupes, 1100 px pour le détail de suivi                                            | `RootLayout.tsx`, `LeaderboardPage.tsx`, `GroupsPage.tsx`, `TrackedDetailPage.tsx` |
| 2   | Navigation = pilule flottante centrée avec `backdrop-blur`, sans hiérarchie (public et personnel mélangés), pilule du joueur au scroll                        | ancien `Nav.tsx`                                                                   |
| 3   | Deux systèmes de surface : `.card` (translucide) et `.surface-solid`, plus des `bg-white/[0.03]` et ombres en valeurs arbitraires (ex. `TrackedPage.tsx:103`) | `globals.css`, pages                                                               |
| 4   | Aucun token de rayon/ombre/espacement hors `--radius` et `--radius-card`                                                                                      | `tokens.css`                                                                       |
| 5   | En-tête de page : `PageHeader` partiel, chaque page recompose son titre                                                                                       | pages                                                                              |
| 6   | Landing : héros centré marketing pleine largeur + 5 sections empilées                                                                                         | `HomePage.tsx`, `features/home`                                                    |
| 7   | Tests e2e périmés (formulaire de recherche remplacé par la palette, détail de suivi sans bouton Modifier) : 3 échecs **déjà présents au commit de base**      | `e2e/*.spec.ts`                                                                    |
| 8   | Débordement interne à 320 px : bannière du profil, heatmap calendaire                                                                                         | `ProfileBanner.tsx`, `CalendarHeatmap.tsx`                                         |
| 9   | Icônes de la palette (⌘K) différentes de celles de la navigation                                                                                              | `CommandPalette.tsx`                                                               |

## À préserver

Hooks TanStack Query, handlers MSW, fixtures, routes et paramètres d'URL, flux Steam OpenID (+ `returnTo`), `RequireAuth`, `SessionExpiredDialog`, palette ⌘K (recherche live à 220 ms, récents, héros, actions), `setNavSubject`, marque animée, `prefers-reduced-motion` partout, compteur de pause du bouton Actualiser.

## Risques de régression identifiés

- Passage au **défilement interne** du panneau : `ScrollRestoration` retiré, remplacé par une mémoire de position par entrée d'historique (`RootLayout.tsx`). Tout code qui lit `window.scrollY` ou utilise `position: sticky` par rapport à la fenêtre est concerné (seul `PlayerPage` l'était, corrigé).
- Le contrat DOM testé change (landmarks : `complementary` « Barre latérale », navigations « Explorer » / « Mon espace », `banner` = header du panneau). Tests mis à jour.

## Décisions

1. **Défilement dans le panneau, pas dans la fenêtre.** C'est ce qui permet un panneau flottant stable et une topbar toujours visible. Coût : la restauration de scroll est gérée à la main.
2. **Fusion « Recherche » et « Joueurs »** : une seule entrée « Joueurs » (`/search`, active aussi sur `/players/*`), la recherche se lance par la palette ou l'accueil.
3. **Navigation personnelle séparée** (« Mon espace », visible connecté seulement) ; déconnecté, un encart explique l'intérêt de la connexion Steam au lieu d'entrées mortes.
4. **Pas de nouvelle dépendance** : indicateur actif glissant en CSS (`transform`), drawer Vaul existant.
