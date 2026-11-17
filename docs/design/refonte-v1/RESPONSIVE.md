# Responsive : règles du shell

| Largeur     | Comportement                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| < 768       | Pas de sidebar, topbar avec bouton menu (drawer gauche) et recherche. Panneau avec 7 px de marge, rayon 20, padding de page 20. Fil d'Ariane réduit à l'élément courant. |
| 768 à 1023  | Idem, marge 12, rayon 24, padding 28.                                                                                                                                    |
| 1024 à 1439 | Sidebar fixe 248 px intégrée au fond, panneau avec marge 16 (haut, bas, droite), rayon 26. La recherche vit dans la sidebar.                                             |
| ≥ 1440      | Padding de page 40. Contenu centré jusqu'à 1760 px ; au-delà, le panneau continue de s'étendre et le contenu reste centré.                                               |

Règle : **aucun débordement horizontal de page** (`overflow-x: hidden` sur `.app-scroll` ne doit jamais masquer du contenu ; un contenu plus large défile dans son propre conteneur, comme la heatmap calendaire).

Largeurs mesurées (profil, `/players/…`) : 320, 768, 1024, 1440, 1920 : scrollWidth − clientWidth = 0 sur le document **et** sur `.app-scroll`. 390 et 2560 : document à 0, vérifiés visuellement. 360, 820, 1280 : 1280 vérifié (palette) ; 360 et 820 : seul le document (0). Non vérifié : seuils intermédiaires systématiques.
