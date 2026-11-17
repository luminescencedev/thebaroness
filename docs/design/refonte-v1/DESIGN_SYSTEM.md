# Design system : état après la Phase 1

Source : `src/styles/tokens.css` (variables), `src/styles/globals.css` (`@theme inline` Tailwind + classes de shell). **Périmètre livré : tokens et shell.** Les composants UI (Button, Input, Tabs, DataTable, etc.) et la page `/dev/ui` ne sont pas encore refaits.

## Surfaces (échelle de luminance)

| Token                                      | Valeur                   | Usage                                                  |
| ------------------------------------------ | ------------------------ | ------------------------------------------------------ |
| `--canvas`                                 | `#090a0c`                | fond global (dégradé diagonal + halo en haut à gauche) |
| `--panel`                                  | `#121316`                | panneau central (dégradé `#18191d` vers `#111215`)     |
| `--surface-1`                              | `#191a1e`                | cartes                                                 |
| `--surface-2`                              | `#1e2024`                | surface élevée                                         |
| `--surface-3`                              | `#25262b`                | hover                                                  |
| `--surface`, `--surface-strong`            | blanc 4 % / 6,5 %        | alias historiques translucides                         |
| `--border`, `--border-strong`, `--divider` | blanc 7 % / 11 % / 5,5 % | bordures, séparateurs                                  |

Texte : `--text #f4f5f7`, `--muted #a1a7b3`, `--subtle #7d8493` (relevé de `#848b99` vers une valeur AA sur `--panel`, à re-mesurer en Phase 6).

## Rayons

`--radius-xs 8` · `--radius 10` (contrôles) · `--radius-md 14` · `--radius-card 16` · `--radius-lg 20` · `--radius-panel 26` (panneau : 20 mobile, 24 tablette, 26 desktop). Pills et avatars ronds : `rounded-full`.

## Ombres

`--shadow-contact`, `--shadow-card` (liseré interne + contact + ambiante), `--shadow-raised`, `--shadow-panel` (contact + ambiante 100 px), `--shadow-popover`, `--shadow-modal`. `.card` et `.surface-solid` les utilisent. Le `backdrop-filter` n'est conservé que sur les scrims et la barre d'onglets du profil.

## Couleurs de données (OKLCH)

`--data-violet` (progression), `--data-cyan` (comparaison), `--data-amber` (repères), `--data-win`, `--data-loss`, `--data-grid`. Définies, **pas encore branchées sur les graphiques** (Phase 4).

## Mouvement

`--dur-fast 150ms` (hover, appui), `--dur-base 220ms` (menus, indicateur), `--dur-slow 320ms` (drawers). Courbes : `--ease-out`, `--ease-in-out`, `--ease-drawer` (inchangées).

## Espacements

Base 4 px (échelle Tailwind). Marges de page par token : `--page-px` 20 / 28 / 40 px (mobile / ≥768 / ≥1440). `--shell-gap 16px`, `--topbar-h 56px`, `--sidebar-w 248px`.

## Shell

- `.app-shell` : grille `[sidebar 248px] [stage]` dès 1024 px, `100dvh`, fond canvas.
- Sidebar (`SidebarNav`) : **transparente**, appartient au fond. Marque, recherche (⌘K), groupes « Explorer » et « Mon espace », compte en pied. Indicateur actif unique qui glisse (`.side-indicator`, `transform` seulement).
- `.app-panel` : le seul élément flottant. Bordure 10 %, liseré lumineux supérieur, ombre de contact + ambiante.
- `.app-topbar` : fil d'Ariane contextuel (`navModel.crumbsFor`), recherche et menu sur mobile.
- `.app-scroll` : conteneur de défilement. `.app-content` : `max-w-[1760px]` centré, padding `--page-px`. Les largeurs de lecture (textes, formulaires) restent à poser **dans** les pages.
- Mobile/tablette (< 1024 px) : sidebar en drawer gauche Vaul (272 px, geste de fermeture).
