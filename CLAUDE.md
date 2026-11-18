# The Baroness, frontend

Frontend React + Vite + TypeScript. Le back est un dépôt séparé : GitHub `LilStick/thebaroness-back` (ancien nom `deadlock-tracker-back`, l'URL redirige). Cloné localement dans `../thebaroness-back` ; son `docs/HANDOFF.md` est le pendant de `docs/HANDOFF.md` d'ici.

## Liaison avec le Claude du back

`docs/HANDOFF.md` est le fichier de liaison destiné au Claude du back. **À chaque rapport rendu à l'utilisateur, mets-le à jour** : ce que le front attend du back, changements de contrat (journal), questions ouvertes. Si tu changes un DTO (`src/api/types.ts`) ou un comportement du mock, mets aussi à jour le contrat concerné dans `docs/back-*.md` et `docs/decisions.md`.
Avant un rapport, consulte l'état du back (`git -C ../thebaroness-back pull`, son README et `docs/openapi.yaml`) et reporte les écarts dans `HANDOFF.md`.

## Workflow Git

Le développement se fait **directement sur `main`** (la branche `refonte-ui` est historique, conservée comme référence, ne plus l'utiliser). Chaque session commence sur `main` : vérifier `git status` et la branche, puis `git fetch` ; ne `pull` que sans risque (arbre propre ou sans conflit possible). Ne jamais perdre de modification existante (pas de `reset --hard`, `clean`, push forcé). Aucun commit ni push sans autorisation explicite de l'utilisateur. Un push sur `main` peut déclencher le déploiement Coolify du front : le signaler avant. Ne pas modifier le dépôt du back.

## Règles

- Interface en français, code et commits en anglais ou français comme dans l'historique. Pas de tiret cadratin ni demi-cadratin, pas d'emoji.
- Pas de co-auteur Claude dans les commits. Pas de push sans demande.
- Aucune donnée inventée hors fixtures synthétiques. Valeur inconnue : `n/d`, jamais 0.
- Jeton JWT en mémoire seulement. Le front n'appelle jamais l'API Deadlock directement.
