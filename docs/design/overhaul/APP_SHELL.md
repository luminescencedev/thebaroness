# App shell

Détails : `../refonte-v1/DESIGN_SYSTEM.md` (section Shell) et `../refonte-v1/RESPONSIVE.md`.

Cette passe : `AppShell` (`src/app/AppShell.tsx`) est désormais séparé de `RootLayout`. Sidebar transparente intégrée au fond, panneau flottant (rayon 20 / 24 / 26), topbar à fil d'Ariane, drawer mobile Vaul, indicateur actif glissant. Défilement dans le panneau, position mémorisée par entrée d'historique.

Non fait : les pages internes ne sont pas encore recomposées avec `DoubleBezel` ni ré-architecturées (voir `UX_DECISIONS.md`).
