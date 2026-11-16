# Double bezel

Composant : `src/components/ui/DoubleBezel.tsx`, styles `.bezel` / `.bezel-inner` dans `globals.css`, page de référence `/dev/ui`.

Structure : coque externe (bordure 8,5 %, dégradé diagonal clair vers sombre, ombre `--shadow-card` ou `--shadow-floating`) + padding (le bezel) + surface interne (liseré 6 %, dégradé 165°, reflet supérieur, ombre interne basse) au rayon concentrique.

Props : `size` sm | md | lg, `elevation` card | floating, `interactive`, `tone` default | accent, `as` (div, article, section, li), `innerClassName`, `className`.

États : normal ; hover doux (translateY -2 px max, bordure et ombre plus claires, appareils à pointeur précis) ; press (scale 0,992) ; focus (anneau sur la coque via `:has(:focus-visible)`) ; disabled (`aria-disabled`) ; reduced-motion sans déplacement. Pas d'état `selected` : pas encore de cas d'usage.

Usage actuel : recherche du hero (`size md`, `floating`), trois widgets (`lg`), deux cartes Groupes / Explorer (`lg`, une avec `tone accent`). Règle : jamais imbriqué ; les lignes de widgets, les tableaux et les petites statistiques restent des surfaces simples.
