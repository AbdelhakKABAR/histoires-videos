# Style « Pico et Plume » — le modèle de TOUTES les vidéos (choix de l'utilisateur, 11 oct. 2026)

L'utilisateur a validé la vidéo « Pico et Plume » (1 minute) et a demandé : « toutes les autres vidéos doivent être comme ça ».
Ce dossier contient cette vidéo complète, prête à être rendue, pour servir de modèle. L'ancien moteur (`moteur/`) ne sert plus qu'à la voix du conteur (`moteur/vo.py`) et au rendu (`moteur/rendu.mjs`).

## Ce qui fait ce style (à garder dans chaque vidéo)
- **1 minute** (59 à 60 s), vertical 1080×1920, 60 images/s, en **3 parties** d'environ 15 à 30 s rendues séparément puis assemblées par un fondu.
- **Un seul lieu, trois lumières** : la même scène change d'ambiance avec l'histoire (pluie froide → soleil doré avec arc-en-ciel → nuit bleue avec lanterne et lucioles). C'est le changement de lumière qui porte l'émotion.
- **Dessin peint en volume** : dégradés sur chaque forme (`ball`, `rgrad`, `lgrad`), ombres douces (`softShadow`), yeux à iris et reflets (`eye`), aucune forme en aplat.
- **Profondeur** : calques de décor pré-rendus et floutés (`buildLayers` : lointain, plan moyen, premier plan flou), caméra qui avance et recule (`camAt`, `layer`).
- **Jeu des personnages** : élan avant le saut, écrasement à l'atterrissage (`sq`, `wobble`), ce qui pend suit avec retard (écharpe, piquants, feuille), regard qui précède le geste, clignements, bouche calée sur la voix (`mouth`).
- **Météo et lumière** : pluie sur deux profondeurs, éclaboussures, brume, rayons, poussières, lucioles, reflet dans la mare, vignette.
- **Sous-titres** : mots blancs à contour sombre qui s'allument un par un (`subs`), couleur différente quand un personnage parle. Morale en grand à la fin, puis « Fin ».
- **Récit au présent**, conteur = voix 3 (Supertonic 2) si l'héroïne est une fille, voix 7 (Supertonic 6) si le héros est un garçon (3e argument de voix.py), personnages = voix d'enfants (fille : Supertonic 1 aiguë, garçon : Supertonic 4 aiguë) — choix de l'utilisateur du 12 oct. 2026, aucune musique (bruits seulement).

## Fichiers
- `exemple-pluie.js`, `exemple-jeu.js`, `exemple-nuit.js` : les trois parties de « Pico et Plume » (chacune est un `film.js` complet et autonome).
  - `exemple-pluie.js` : décor de forêt, pluie, `bigLeaf` (la feuille-parapluie), `hedgehog()` (hérisson de profil), `bird()` (oisillon), passage de la pluie au soleil.
  - `exemple-jeu.js` : même décor au soleil ; `ACT(t, tr)` écrit un jeu nouveau (l'oiseau vole en rond, le hérisson le suit des yeux et saute) : c'est l'exemple à suivre pour écrire une action.
  - `exemple-nuit.js` : la nuit (ciel, lune, étoiles, voile bleu en `multiply`), `lantern()`, lucioles en `lighter`, morale en grand et « Fin ».
- `histoire-exemple/*.json` : le texte de chaque partie, avec la seconde de départ de chaque phrase (`at`).
- `voix.py` : `uv run voix.py <partie> <dossier des voix> 3|7` → `audio/vo.wav` + `timeline.js`. Affiche le début et la fin de chaque phrase et signale les chevauchements.
- `ambiance.py` : `uv run ambiance.py <partie> pluie|jour|nuit` → `audio/music.wav` (bruits seulement). À adapter : les instants des pas et des battements d'ailes y sont écrits en dur.
- `assemble.sh` : `./assemble.sh p1 p2 p3 sortie.mp4` → la vidéo finale (fondu de 0,4 s entre les parties, moins de 28 Mo).

## Faire une nouvelle vidéo dans ce style
1. Pour chaque partie : `node <skill>/scripts/scaffold.mjs p1 --duration 18 --formats 9x16` (durées libres, total 60 s en comptant 0,8 s perdue dans les deux fondus), puis écrire `beats.json` à 120 bpm :
   `{"bpm":120,"period":0.5,"offset":0,"beats":[0,0.5,…],"downbeats":[…],"sections":[{"name":"main","beat":0}],"duration":18}` (les bruitages HITS sont en temps = 2 × secondes).
2. Police : `npm i @fontsource/fredoka` puis copier `fredoka-latin-600-normal.woff2` en `fonts/display.woff2` (et en `fonts/ui.woff2`).
3. Écrire `story.json` de chaque partie (au présent), lancer `voix.py`, régler les `at`.
4. Copier l'exemple le plus proche en `film.js` et l'adapter : nouveaux personnages, nouveau décor, nouvelle action.
   - **Nouveau personnage** : écrire une fonction sur le modèle de `hedgehog()` ou `bird()` (mêmes techniques : `ball`, dégradés, `eye`, joues roses, ombre douce, parties qui suivent avec retard). Ne jamais revenir à des formes en aplat.
   - **Nouveau décor** : adapter `buildLayers()` (calques flous lointain / moyen / premier plan) et le sol dans `draw()`. Garder au moins 4 profondeurs.
   - **Nouvelle action** : écrire `ACT(t, tr)` comme dans `exemple-jeu.js` ; il renvoie l'état de chaque personnage à l'instant `tr` (secondes réelles). Les phrases viennent de `TL.phrases` (timeline.js).
   - Chaque couleur `rgba(...)` calculée passe par `A(valeur)` (sinon le rendu plante sur une opacité négative).
5. Contrôle : `node <skill>/scripts/render.mjs --film p1 --format 9x16 --at 1,4,8,… --noblur`, regarder les images, corriger.
6. Son : `ambiance.py`, puis `node <skill>/scripts/sfx.mjs p1` et `node <skill>/scripts/mix.mjs p1 --music-db -3 --sfx-db -4 --vo-db 3 --no-mux`.
7. Rendu : `node rendu.mjs --film p1 --workers 10` (rendu.mjs est dans `moteur/`), pour chaque partie.
8. `./assemble.sh p1 p2 p3 video.mp4`, vérifier avec ffprobe (59 à 60 s, 1080×1920, son présent).

## Limite connue
Ces dessins sont faits par code. L'utilisateur préfère encore le style « peint » d'images générées par IA, mais elles ne peuvent pas être téléchargées dans les sessions (accès réseau refusé vers Figma) : ne pas tenter de générer des images.
