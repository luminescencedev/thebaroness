# Integration a `luminescencedev/thebaroness`

Le pack est adapte a la version `main` consultee le 16 novembre 2026 (arborescence de commit tree `3468ea60508724815a009c9079d398bba9137673`). Il **ne modifie pas** votre depot GitHub.

## 1. Copie recommandee

Copier les repertoires `logos`, `favicons`, `graphics`, `backgrounds`, `social` dans `thebaroness/public/brand/`.

Ne pas copier `react`, `docs`, `styles`, ou `preview` dans `public/brand` : ils servent de sources d'integration et de documentation.

## 2. Wordmark dans la navigation

Vous avez `src/components/layout/Wordmark.tsx` dans le projet. Son contrat actuel est conservé (`export function Wordmark()`, `Link`, `aria-label`).

- Remplacer **facultativement** ce fichier par `react/Wordmark.tsx`.
- Le nouveau pictogramme prend 26 px : tester la barre pill `h-14` de `src/components/layout/Nav.tsx` a 375 px et au breakpoint `md`.
- Si vous preferez conserver votre wordmark texte actuel, utilisez seulement le nouveau favicon, les OG et les visuels de page.

## 3. Favicon / metadata

- Copiez `favicons/favicon.svg` vers `public/favicon.svg` pour ne pas modifier le lien de `index.html`.
- Copiez les autres fichiers dans `public/brand/favicons`.
- Ajoutez dans `index.html` les meta tags :

```html
<meta name="theme-color" content="#060709" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<meta property="og:image" content="https://thebaroness.gg/brand/social/og-default-1200x630.jpg" />
<meta name="twitter:card" content="summary_large_image" />
```

Ajustez l'URL OG au domaine effectivement deploye ; `thebaroness.gg` n'a pas ete verifie comme domaine possede ou actif.

## 4. Optionnel : fond hero

La page `src/pages/HomePage.tsx` possede deja `hero-glow`, `hero-grid` et une minimap. Le fond graphique doit donc rester **optionnel** pour ne pas surcharger les statistiques et la barre de recherche.

```tsx
<div aria-hidden="true" className="baroness-hero-art absolute inset-0 -z-10" />
```

N'ajoutez cet element que dans le `<section>` hero qui dispose deja de `relative isolate`, puis importez le CSS `styles/brand-optional.css` dans l'app (ou recopiez la regle locale). La superposition doit rester sombre et ne pas voler le contraste des titres.

## 5. Graphics et usage

- `graphics/svg/deco-divider.svg` : separateur editorial entre sections longues, pas dans toutes les cartes.
- `graphics/svg/portal-arch.svg` : illustration tres discrete des vides, modales ou page login.
- `graphics/svg/empty-state-search.svg` : lorsque les recherches n'ont aucun resultat, avec un texte d'erreur reel.
- `graphics/svg/empty-state-tracked.svg` : etat vide de la liste de suivis.
- `graphics/svg/rank-radiance.svg` : halo derriere un vrai badge de rang Valve, **pas** un badge de rang fictif.
- `graphics/svg/sigil-eye.svg` : symbole secondaire decoratif, pas icone d'action sans libelle.

## 6. Pas de travail backend

Le pack n'interagit pas avec Express ni MongoDB. Il n'altère pas les DTO `src/api/types.ts`, MSW, `src/contracts/openapi.yaml`, `docs/HANDOFF.md`, ni les endpoints.

## 7. Validation

- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e` (apres installation Chromium, si disponible)
- Test manuel a 375 px, 768 px, 1440 px et contraste a zoom 200 %.

Le code est un kit d'integration, pas un commit applique et teste dans votre projet.
