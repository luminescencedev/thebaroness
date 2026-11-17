# Tokens

Source de vérité : `src/styles/tokens.css`. Détail des surfaces, rayons, couleurs de données et durées : `../refonte-v1/DESIGN_SYSTEM.md`.

Ajouts de cette passe :

- `--bezel-{sm,md,lg}-{r,p}` : rayon externe 16 / 20 / 26 px, padding 3 / 4 / 5 px. Rayon interne = rayon externe - padding (13 / 16 / 21 px).
- `--shadow-floating` (landing, recherche), `--shadow-overlay` (alias de `--shadow-modal`).
- Écart avec la demande : les noms `--bg-base`, `--text-primary`, etc. ne sont pas adoptés ; les alias existants (`--bg`, `--text`, `--muted`, `--subtle`, `--surface*`) sont conservés pour ne pas réécrire 60 fichiers. Valeurs proches : canvas `#090a0c`, panel `#121316`, surface-1 `#191a1e`, surface-2 `#1e2024`, surface-3 `#25262b`. `--text-tertiary` visé `#858894` : `--subtle` est à `#7d8493`, non relevé (contraste à mesurer).
- Landing : valeurs locales dans `globals.css` (`.landing-scene`, `.pill-nav`), pas de nouveau token.
