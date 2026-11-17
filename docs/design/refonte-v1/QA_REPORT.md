# QA : état après la Phase 1

## Exécuté

| Commande            | Résultat                                                |
| ------------------- | ------------------------------------------------------- |
| `npm run typecheck` | OK                                                      |
| `npm run lint`      | OK                                                      |
| `npm run test`      | 45/45                                                   |
| `npm run build`     | OK                                                      |
| `npm run test:e2e`  | 16 passés, 2 ignorés (parcours desktop-only sur mobile) |

Le e2e avait **3 échecs au commit de base** (vérifié dans un worktree propre). Les tests ont été réalignés sur l'interface réelle (recherche par l'accueil ou la palette, détail de suivi sans bouton « Modifier », nouveaux landmarks). Aucun test supprimé.

## Captures (Chromium headless, `npm run dev:mock`) : `screenshots/`

Shell : profil à 320, 768, 1024, 1440, 1920 ; drawer mobile 390 ; palette ⌘K 1280. Les captures `*_ancienne-page` montrent des pages **pas encore refaites** dans le nouveau shell.

## Non fait / limites

- Phases 2 à 6 : composants UI (Button, Input, Tabs, DataTable...), `/dev/ui`, refonte du profil, des graphiques et des autres pages, accueil, états système.
- Pas de revue de contraste mesurée (outil) ; `--subtle` ajusté à l'œil.
- Skill Emil Kowalski non chargé cette session (présent : `anthropic-skills:emil-design-eng`), à utiliser pour la phase mouvement.
- `MOTION.md`, `UX_DECISIONS.md` non rédigés (rien de décidé page par page).
