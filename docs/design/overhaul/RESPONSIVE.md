# Responsive

Landing : cadre `min(100% - 32px, 1380px)` (64 px dès 768 px). Widgets : 1 colonne < 768, 2 colonnes (classement sur toute la largeur) 768 à 1023, 3 colonnes dès 1024. Illustrations : droite très atténuée sous 768, gauche masquée sous 768. Navbar : pilule compacte sous 768.

Shell : voir `../refonte-v1/RESPONSIVE.md`.

Vérifié (landing, Chromium, `scrollWidth - clientWidth = 0`) : 320, 390, 768, 1024, 1440, 1920, 2560. Visuellement inspectés : 320, 390, 1440, 2560 (+ menu mobile ouvert). Non vérifiés : 360, 820, 1280 sur la landing ; états de chargement et d'erreur des widgets (code présent, non rendus en capture).
