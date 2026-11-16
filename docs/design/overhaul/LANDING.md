# Landing (`/`)

- **Architecture** : `RootLayout` (palette ⌘K, session expirée) > `LandingLayout` (scène, `PillNavbar`, défilement de la fenêtre) > `HomePage`. Le reste des routes passe par `AppShell`.
- **Navbar** (`PillNavbar`) : pilule centrée 860 px max, sans marque. Liens : Joueurs, Héros, Classement, Groupes (+ Mes suivis connecté), recherche ⌘K, Connexion Steam ou menu compte. Mobile : premier lien, recherche, menu (popover Base UI animé).
- **Hero** : eyebrow, `the baroness.` (h1), phrase courte, recherche double bezel (`HeroSearch`, route `/search?q=`, raccourci `/`), deux liens d'exploration. Illustrations : deux héros du catalogue (Wraith / Haze, Seven / Vindicta, repli sur les premiers du catalogue), masquées, très atténuées sur mobile.
- **Widgets** (`features/home/widgets.tsx`) :
  - _Joueur_ : **aperçu d'exemple signalé comme tel** (le contrat n'offre aucune liste globale de joueurs) + « consultés récemment » réels (stockage local) si présents.
  - _Héros et méta_ : 5 héros d'une sélection fixe, victoires et sélection réels via `GET /heroes/:id/stats` (n/d si absent). C'est une **sélection**, pas un classement méta.
  - _Classement_ : top 5 réel via `GET /leaderboard`, onglets Europe / Amérique N. / Asie, lien profil si `steamId`.
- **Groupes** et **Explorer** : deux cartes double bezel, liens réels (`/groups` redirige vers la connexion si besoin). Illustration de groupe signalée « sans donnée réelle ».
- **Pied de page** : mention d'indépendance et source, sans bande.
- **Écarts avec la référence V3** : pas de suggestions de recherche en direct dans le hero (la palette ⌘K le fait), pas de point de grille, pas de widget joueur fictif nommé en production.
