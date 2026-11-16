# Mouvement

Tokens : `--dur-fast 150 ms`, `--dur-base 220 ms`, `--dur-slow 320 ms`, courbes `--ease-out` / `--ease-in-out` / `--ease-drawer`.

Cette passe : indicateur actif de sidebar (transform seul), menu mobile de la landing (opacité + translation 6 px + scale 0,98, 220 ms entrée / 150 ms sortie), hover / press du double bezel, `Reveal` conservé pour l'entrée du hero et des widgets. `prefers-reduced-motion` neutralise les déplacements.

Conservés tels quels : marque animée, dialogues, `pressable`, skeletons, `chart-reveal`. Non audité en profondeur : gestures Vaul au-delà du drawer de navigation. Skill Emil Kowalski non chargé.
