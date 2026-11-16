# Audit (état au début de cette passe)

Point de départ : shell livré en phase 1 (voir `../refonte-v1/AUDIT.md`), landing encore de l'ancienne génération.

- **Landing** : héros marketing centré (slogan, grille décorative, halo violet), cinq sections empilées, navbar pilule avec marque, enveloppée dans le shell de largeur maximale 1152 px. Non conforme à la direction V3.
- **Layout** : un seul `RootLayout` portait navbar, contenu et pied de page pour toutes les routes.
- **Surfaces** : pas de primitive double bezel ; `.card` seul.
- **Pas de page laboratoire**.
- **Références** : `landing-reference-v3.html` fourni (copié dans `docs/design/`), `shell-reference-v3.html` = copie du prototype de shell déjà étudié.
- **Skill Emil Kowalski** : `anthropic-skills:emil-design-eng` est listé dans cet environnement mais n'a pas été chargé dans cette passe.

À conserver : routes, hooks, MSW, palette ⌘K, flux Steam `returnTo`, `Reveal`, `HeroPortrait`, `RankBadge`, marque animée dans la sidebar.
